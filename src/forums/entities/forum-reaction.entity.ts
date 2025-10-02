// src/forums/entities/forum-reaction.entity.ts
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
import { Forum } from './forum.entity';

export enum ReactionType {
  LIKE = 'like',
  NOT_LIKE = 'not_like',
  FUNNY = 'funny',
  LOVE = 'love',
}

@Entity('forum_reactions')
@Unique(['userId', 'forumId'])
export class ForumReaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ReactionType,
    default: ReactionType.LIKE,
  })
  type: ReactionType;

  @ManyToOne(() => Forum, (forum) => forum.reactions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'forumId' })
  forum: Forum;

  @Column()
  @Index()
  forumId: string;

  @ManyToOne(() => User, (user) => user.forumReactions)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @CreateDateColumn()
  createdAt: Date;
}