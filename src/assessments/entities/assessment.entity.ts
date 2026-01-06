// src/assessments/entities/assessment.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    DeleteDateColumn, ManyToOne, JoinColumn, OneToOne, OneToMany
} from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { AssessmentConfiguration } from './assessment-config.entity';
import { AssessmentTranslation } from './assessment-translation.entity';
import { AssessmentQuestion } from './assessment-question.entity';
import { AssessmentAttempt } from './assessment-attempt.entity';

export enum AssessmentType {
    EVALUATION = 'evaluation',        // Evaluación calificable
    SURVEY = 'survey',                // Encuesta (puede ser calificable o no)
    SELF_ASSESSMENT = 'self_assessment' // Autoevaluación
}

export enum AssessmentStatus {
    DRAFT = 'draft',
    PUBLISHED = 'published',
    ARCHIVED = 'archived',
    SUSPENDED = 'suspended'
}

@Entity('assessments')
export class Assessment {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    slug: string; // ej: "evaluacion-modulo-1-cardio"

    @ManyToOne(() => Tenant, tenant => tenant.assessments)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @ManyToOne(() => Courses, course => course.assessments, { nullable: true })
    @JoinColumn({ name: 'courseId' })
    course: Courses;

    @Column({ nullable: true })
    courseId: string;

    @Column({
        type: 'enum',
        enum: AssessmentType,
        default: AssessmentType.EVALUATION
    })
    type: AssessmentType;

    @Column({
        type: 'enum',
        enum: AssessmentStatus,
        default: AssessmentStatus.DRAFT
    })
    status: AssessmentStatus;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: 0 })
    order: number; // Orden de aparición en el curso

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;

    @DeleteDateColumn()
    deleted_at: Date;

    @OneToOne(() => AssessmentConfiguration, config => config.assessment, {
        cascade: true,
        eager: false
    })
    configuration: AssessmentConfiguration;

    @OneToMany(() => AssessmentTranslation, translation => translation.assessment, {
        cascade: true,
        eager: true
    })
    translations: AssessmentTranslation[];

    @OneToMany(() => AssessmentQuestion, question => question.assessment, {
        cascade: true
    })
    questions: AssessmentQuestion[];

    @OneToMany(() => AssessmentAttempt, attempt => attempt.assessment)
    attempts: AssessmentAttempt[];

    // Métodos helper
    getTranslation(languageCode: string): AssessmentTranslation | undefined {
        return this.translations?.find(t => t.languageCode === languageCode);
    }

    getTranslatedTitle(languageCode: string = 'es'): string {
        const translation = this.getTranslation(languageCode);
        return translation?.title || this.slug;
    }

    getGradableQuestions(): AssessmentQuestion[] {
        return this.questions?.filter(q => q.isGradable) || [];
    }

    getAdditionalQuestions(): AssessmentQuestion[] {
        return this.questions?.filter(q => !q.isGradable) || [];
    }

    getTotalPoints(): number {
        return this.getGradableQuestions()
            .reduce((sum, q) => sum + (q.points || 0), 0);
    }
}