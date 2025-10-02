// src/forums/entities/comment-reaction.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ForumComment } from './forum-comment.entity';

export enum CommentReactionType {
  LIKE = 'like',
  HELPFUL = 'helpful',
}

@Entity('comment_reactions')
@Unique(['userId', 'commentId'])
export class CommentReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: CommentReactionType,
    default: CommentReactionType.LIKE,
  })
  type: CommentReactionType;

  @ManyToOne(() => ForumComment, (comment) => comment.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'commentId' })
  comment: ForumComment;

  @Column()
  @Index()
  commentId: string;

  @ManyToOne(() => User, (user) => user.commentReactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}