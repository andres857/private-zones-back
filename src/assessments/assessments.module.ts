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

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Assessment,
            AssessmentTranslation,
            AssessmentConfiguration,
            Courses,
        ]),
        TenantsModule,
    ],
    controllers: [AssessmentsController],
    providers: [AssessmentsService, TenantValidationInterceptor],
    exports: [AssessmentsService],
})
export class AssessmentsModule { }
