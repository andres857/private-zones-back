import { Module } from '@nestjs/common';
import { AssessmentsController } from './assessments.controller';
import { AssessmentsService } from './assessments.service';
import { TenantValidationInterceptor } from 'src/auth/interceptors/tenant-validation.interceptor';
import { TenantsModule } from 'src/tenants/tenants.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Assessment } from './entities/assessment.entity';
import { AssessmentTranslation } from './entities/assessment-translation.entity';
import { AssessmentConfiguration } from './entities/assessment-config.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { AssessmentQuestion } from './entities/assessment-question.entity';
import { AssessmentQuestionOption } from './entities/assessment-question-option.entity';
import { AssessmentQuestionTranslation } from './entities/assessment-question-translation.entity';
import { AssessmentQuestionOptionTranslation } from './entities/assessment-question-option-translation.entity';
import { AssessmentAttempt } from './entities/assessment-attempt.entity';
import { AssessmentAttemptAnswer } from './entities/assessment-attempt-answer.entity';
import { QuestionsService } from './questions.service';
import { AssessmentSession } from './entities/assessment-session.entity';
import { AssessmentSessionsService } from './assessment-sessions.service';
import { AssessmentSessionsController } from './assessment-sessions.controller';
import { AssessmentAttemptsController } from './assessment-attempts.controller';
import { AssessmentAttemptsService } from './assessment-attempts.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Assessment,
            AssessmentSession,
            AssessmentConfiguration,
            AssessmentTranslation,
            AssessmentQuestion,
            AssessmentQuestionOption,
            AssessmentQuestionTranslation,
            AssessmentQuestionOptionTranslation,
            AssessmentAttempt,
            AssessmentAttemptAnswer,
            Courses,
        ]),
        TenantsModule,
    ],
    controllers: [AssessmentsController, AssessmentSessionsController, AssessmentAttemptsController],
    providers: [AssessmentsService, QuestionsService, TenantValidationInterceptor, AssessmentSessionsService, AssessmentAttemptsService],
    exports: [AssessmentsService, QuestionsService, AssessmentAttemptsService],
})
export class AssessmentsModule { }
