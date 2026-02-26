import { forwardRef, Module } from '@nestjs/common';
import { ForumsController } from './forums.controller';
import { ForumsService } from './forums.service';
import { TenantsModule } from 'src/tenants/tenants.module';
import { Forum } from './entities/forum.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Courses } from 'src/courses/entities/courses.entity';
import { ForumComment } from './entities/forum-comment.entity';
import { ForumReaction } from './entities/forum-reaction.entity';
import { CommentReaction } from './entities/comment-reaction.entity';
import { UsersProgressModule } from 'src/progress/user-progress.module';
import { ModuleItem } from 'src/courses/entities/courses-modules-item.entity';

@Module({
  imports: [
    TenantsModule,
    TypeOrmModule.forFeature([
      Forum,
      ForumComment,
      ForumReaction,
      CommentReaction,
      Courses,
      ModuleItem
    ]),
    forwardRef(() => UsersProgressModule),
  ],
  controllers: [ForumsController],
  providers: [ForumsService],
  exports: [ForumsService]
})
export class ForumsModule {}
