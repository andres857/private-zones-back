import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AssessmentQuestion } from './entities/assessment-question.entity';
import { AssessmentQuestionOption } from './entities/assessment-question-option.entity';
import { AssessmentQuestionTranslation } from './entities/assessment-question-translation.entity';
import { AssessmentQuestionOptionTranslation } from './entities/assessment-question-option-translation.entity';
import { Assessment } from './entities/assessment.entity';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
    constructor(
        @InjectRepository(AssessmentQuestion)
        private readonly questionRepository: Repository<AssessmentQuestion>,
        @InjectRepository(AssessmentQuestionOption)
        private readonly optionRepository: Repository<AssessmentQuestionOption>,
        @InjectRepository(AssessmentQuestionTranslation)
        private readonly questionTranslationRepository: Repository<AssessmentQuestionTranslation>,
        @InjectRepository(AssessmentQuestionOptionTranslation)
        private readonly optionTranslationRepository: Repository<AssessmentQuestionOptionTranslation>,
        @InjectRepository(Assessment)
        private readonly assessmentRepository: Repository<Assessment>,
        private readonly dataSource: DataSource,
    ) { }

    async getQuestionsByAssessment(assessmentId: string, tenantId: string): Promise<AssessmentQuestion[]> {
        // Verificar que el assessment existe y pertenece al tenant
        const assessment = await this.assessmentRepository.findOne({
            where: { id: assessmentId, tenantId },
        });

        if (!assessment) {
            throw new NotFoundException('Assessment no encontrado');
        }

        const questions = await this.questionRepository.find({
            where: { assessmentId },
            relations: ['translations', 'options', 'options.translations'],
            order: { order: 'ASC' },
        });

        return questions;
    }

    async saveQuestions(
        assessmentId: string,
        tenantId: string,
        questionsData: CreateQuestionDto[]
    ): Promise<AssessmentQuestion[]> {
        // Verificar que el assessment existe y pertenece al tenant
        const assessment = await this.assessmentRepository.findOne({
            where: { id: assessmentId, tenantId },
        });

        if (!assessment) {
            throw new NotFoundException('Assessment no encontrado');
        }

        // Transacción SOLO para guardar
        await this.dataSource.transaction(async (manager) => {
            // Eliminar preguntas existentes
            await manager.delete(AssessmentQuestion, { assessmentId });

            // Crear nuevas preguntas
            for (const [index, questionData] of questionsData.entries()) {
                const { id: _questionId, translations, options, ...questionFields } = questionData;

                // Crear pregunta
                const question = manager.create(AssessmentQuestion, {
                    ...questionFields,
                    assessmentId,
                    order: questionData.order ?? index,
                });

                const savedQuestion = await manager.save(AssessmentQuestion, question);

                // Crear traducciones de pregunta
                if (translations && translations.length > 0) {
                    const translationEntities = translations.map(t =>
                        manager.create(AssessmentQuestionTranslation, {
                            ...t,
                            questionId: savedQuestion.id,
                        })
                    );
                    await manager.save(AssessmentQuestionTranslation, translationEntities);
                }

                // Crear opciones de pregunta
                if (options && options.length > 0) {
                    for (const [optionIndex, optionData] of options.entries()) {
                        const { id: _optionId, translations: optionTranslations, ...optionFields } = optionData;

                        const option = manager.create(AssessmentQuestionOption, {
                            ...optionFields,
                            questionId: savedQuestion.id,
                            order: optionData.order ?? optionIndex,
                        });

                        const savedOption = await manager.save(AssessmentQuestionOption, option);

                        // Crear traducciones de opción
                        if (optionTranslations && optionTranslations.length > 0) {
                            const optionTranslationEntities = optionTranslations.map(t =>
                                manager.create(AssessmentQuestionOptionTranslation, {
                                    ...t,
                                    optionId: savedOption.id,
                                })
                            );
                            await manager.save(AssessmentQuestionOptionTranslation, optionTranslationEntities);
                        }
                    }
                }
            }
        });

        // Cargar preguntas con relaciones FUERA de la transacción
        const finalQuestions = await this.questionRepository.find({
            where: { assessmentId },
            relations: ['translations', 'options', 'options.translations'],
            order: { order: 'ASC' },
        });

        return finalQuestions;
    }

    async deleteQuestion(questionId: string, assessmentId: string, tenantId: string): Promise<void> {
        // Verificar que el assessment existe y pertenece al tenant
        const assessment = await this.assessmentRepository.findOne({
            where: { id: assessmentId, tenantId },
        });

        if (!assessment) {
            throw new NotFoundException('Assessment no encontrado');
        }

        // Verificar que la pregunta existe y pertenece al assessment
        const question = await this.questionRepository.findOne({
            where: { id: questionId, assessmentId },
        });

        if (!question) {
            throw new NotFoundException('Pregunta no encontrada');
        }

        await this.questionRepository.delete(questionId);
    }
}