import { Module } from '@nestjs/common';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { TenantsModule } from 'src/tenants/tenants.module';
import { Forum } from './entities/forum.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courses } from 'src/courses/entities/courses.entity';

@Module({
  imports: [
    TenantsModule,
    TypeOrmModule.forFeature([
      Forum,
      Courses
    ]),
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService]
})
export class ForumsModule {}
