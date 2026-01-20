// src/assessments/assessment-sessions.service.ts

import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from './entities/assessment-session.entity';
import { AssessmentAttempt, AttemptStatus } from './entities/assessment-attempt.entity';
import { AssessmentsService } from './assessments.service';
import * as crypto from 'crypto';

@Injectable()
export class AssessmentSessionsService {
    constructor(
        @InjectRepository(AssessmentSession)
        private sessionRepository: Repository<AssessmentSession>,
        @InjectRepository(AssessmentAttempt)
        private attemptRepository: Repository<AssessmentAttempt>,
        private assessmentsService: AssessmentsService,
    ) { }

    async createSession(
        assessmentId: string,
        userId: string,
        tenantId: string,
    ): Promise<{ token: string; attemptId: string }> {
        // Verificar que la evaluación existe
        const assessment = await this.assessmentsService.getById(assessmentId, tenantId);

        // Verificar cuántos intentos ha realizado el usuario
        const attemptsCount = await this.attemptRepository.count({
            where: {
                assessmentId,
                userId,
            },
        });

        // Verificar si puede hacer más intentos
        const maxAttempts = assessment.configuration?.maxAttempts || 1;
        if (maxAttempts > 0 && attemptsCount >= maxAttempts) {
            throw new BadRequestException('Has alcanzado el número máximo de intentos');
        }

        // Crear nuevo intento
        const attempt = this.attemptRepository.create({
            assessmentId,
            userId,
            attemptNumber: attemptsCount + 1,
            status: AttemptStatus.IN_PROGRESS,
            startedAt: new Date(),
        });

        const savedAttempt = await this.attemptRepository.save(attempt);

        // Generar token único
        const token = this.generateToken(assessmentId, userId);

        // Crear sesión (expira en 12 horas por defecto)
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 12);

        const session = this.sessionRepository.create({
            assessmentId,
            userId,
            token,
            attemptId: savedAttempt.id,
            expiresAt,
        });

        await this.sessionRepository.save(session);

        return {
            token,
            attemptId: savedAttempt.id,
        };
    }

    async validateToken(
        token: string,
        assessmentId: string,
    ): Promise<AssessmentSession> {
        const session = await this.sessionRepository.findOne({
            where: { token },
            relations: ['assessment', 'user'],
        });

        if (!session) {
            throw new UnauthorizedException('Token inválido');
        }

        if (session.assessmentId !== assessmentId) {
            throw new UnauthorizedException('Token no corresponde a esta evaluación');
        }

        if (session.isExpired()) {
            throw new UnauthorizedException('Token expirado');
        }

        if (session.used) {
            throw new UnauthorizedException('Token ya utilizado');
        }

        return session;
    }

    async markAsUsed(sessionId: string): Promise<void> {
        await this.sessionRepository.update(sessionId, {
            used: true,
            usedAt: new Date(),
        });
    }

    private generateToken(assessmentId: string, userId: string): string {
        const randomBytes = crypto.randomBytes(32).toString('hex');
        const data = `${assessmentId}-${userId}-${Date.now()}-${randomBytes}`;
        return Buffer.from(data).toString('base64url');
    }
}