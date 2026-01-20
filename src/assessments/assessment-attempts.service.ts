import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentAttempt, AttemptStatus } from './entities/assessment-attempt.entity';
import { AssessmentAttemptAnswer } from './entities/assessment-attempt-answer.entity';
import { Assessment } from './entities/assessment.entity';
import { AssessmentQuestion } from './entities/assessment-question.entity';

@Injectable()
export class AssessmentAttemptsService {
    constructor(
        @InjectRepository(AssessmentAttempt)
        private attemptRepository: Repository<AssessmentAttempt>,
        @InjectRepository(AssessmentAttemptAnswer)
        private answerRepository: Repository<AssessmentAttemptAnswer>,
        @InjectRepository(Assessment)
        private assessmentRepository: Repository<Assessment>,
        @InjectRepository(AssessmentQuestion)
        private questionRepository: Repository<AssessmentQuestion>,
    ) { }

    async submitAttempt(
        attemptId: string,
        userId: string,
        tenantId: string,
        answers: Record<string, any>,
    ) {
        // Buscar el intento
        const attempt = await this.attemptRepository.findOne({
            where: { id: attemptId, userId },
            relations: ['assessment', 'assessment.configuration', 'assessment.questions', 'assessment.questions.options'],
        });

        if (!attempt) {
            throw new NotFoundException('Intento no encontrado');
        }

        if (attempt.status !== AttemptStatus.IN_PROGRESS) {
            throw new BadRequestException('Este intento ya fue enviado');
        }

        // Verificar que el assessment pertenece al tenant
        if (attempt.assessment.tenantId !== tenantId) {
            throw new UnauthorizedException('No autorizado');
        }

        // Procesar respuestas y calcular calificación
        let totalPoints = 0;
        let earnedPoints = 0;
        const answersToSave: AssessmentAttemptAnswer[] = [];

        for (const question of attempt.assessment.questions.filter(q => q.isGradable)) {
            const userAnswer = answers[question.id];

            if (!userAnswer && question.isRequired) {
                throw new BadRequestException(`La pregunta ${question.order + 1} es obligatoria`);
            }

            totalPoints += Number(question.points);

            // Calificar según tipo de pregunta
            const { isCorrect, pointsEarned } = this.gradeQuestion(question, userAnswer);

            // Crear respuesta
            const answer = this.answerRepository.create({
                attemptId,
                questionId: question.id,
                selectedOptionIds:
                question.type === 'multiple_choice'
                    ? Array.isArray(userAnswer)
                        ? userAnswer
                        : userAnswer
                        ? [userAnswer]
                        : []
                    : [],
                textAnswer: (question.type === 'short_answer' || question.type === 'essay') ? userAnswer : null,
                isCorrect,
                pointsEarned,
            });

            answersToSave.push(answer);
            earnedPoints += Number(pointsEarned || 0);
        }

        // Guardar respuestas
        await this.answerRepository.save(answersToSave);

        console.log('earnedPoints:', earnedPoints, 'totalPoints:', totalPoints);

        // Actualizar intento
        const score = totalPoints > 0 ? (earnedPoints / totalPoints) * attempt.assessment.configuration.maxScore : 0;
        const percentage = totalPoints > 0 ? (earnedPoints / totalPoints) * 100 : 0;
        const passed = attempt.assessment.configuration.passingScore
            ? score >= attempt.assessment.configuration.passingScore
            : true;

        attempt.status = AttemptStatus.COMPLETED;
        attempt.completedAt = new Date();
        attempt.submittedAt = new Date();
        attempt.score = score;
        attempt.percentage = percentage;
        attempt.passed = passed;
        attempt.timeSpent = attempt.calculateTimeSpent();

        await this.attemptRepository.save(attempt);

        return {
            attemptId: attempt.id,
            score,
            percentage,
            passed,
            totalPoints,
            earnedPoints,
        };
    }

    private gradeQuestion(question: AssessmentQuestion, userAnswer: any): { isCorrect: boolean; pointsEarned: number } {
        if (!userAnswer) {
            return { isCorrect: false, pointsEarned: 0 };
        }

        switch (question.type) {
            case 'multiple_choice':
                const correctOption = question.options.find(o => o.isCorrect);
                const isCorrect = correctOption?.id === userAnswer;
                return {
                    isCorrect,
                    pointsEarned: isCorrect ? question.points : 0,
                };

            case 'multiple_response':
                const correctOptionIds = question.options.filter(o => o.isCorrect).map(o => o.id).sort();
                const userAnswerArray = Array.isArray(userAnswer) ? userAnswer.sort() : [];
                const isMultiCorrect = JSON.stringify(correctOptionIds) === JSON.stringify(userAnswerArray);

                if (question.allowPartialCredit) {
                    const correctCount = userAnswerArray.filter(id => correctOptionIds.includes(id)).length;
                    const incorrectCount = userAnswerArray.filter(id => !correctOptionIds.includes(id)).length;
                    const partialPoints = ((correctCount - incorrectCount) / correctOptionIds.length) * question.points;
                    return {
                        isCorrect: isMultiCorrect,
                        pointsEarned: Math.max(0, partialPoints),
                    };
                }

                return {
                    isCorrect: isMultiCorrect,
                    pointsEarned: isMultiCorrect ? question.points : 0,
                };

            case 'true_false':
                const tfCorrect = question.options.find(o => o.isCorrect);
                const tfIsCorrect = tfCorrect?.id === userAnswer ||
                    (tfCorrect?.translations?.[0]?.optionText?.toLowerCase() === userAnswer?.toLowerCase());
                return {
                    isCorrect: tfIsCorrect,
                    pointsEarned: tfIsCorrect ? question.points : 0,
                };

            case 'short_answer':
            case 'essay':
                // Requiere calificación manual
                return {
                    isCorrect: false,
                    pointsEarned: 0,
                };

            default:
                return { isCorrect: false, pointsEarned: 0 };
        }
    }
}