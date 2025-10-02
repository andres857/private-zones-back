// src/forums/entities/forum-comment.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Forum } from './forum.entity';
import { CommentReaction } from './comment-reaction.entity';

@Entity('forum_comments')
export class ForumComment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'boolean', default: false })
  isEdited: boolean;

  @ManyToOne(() => Forum, (forum) => forum.comments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'forumId' })
  forum: Forum;

  @Column()
  @Index()
  forumId: string;

  @ManyToOne(() => User, (user) => user.comments)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  @Index()
  authorId: string;

  // Para comentarios anidados (respuestas)
  @ManyToOne(() => ForumComment, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'parentCommentId' })
  parentComment: ForumComment;

  @Column({ nullable: true })
  @Index()
  parentCommentId: string;

  @OneToMany(() => ForumComment, (comment) => comment.parentComment)
  replies: ForumComment[];

  @OneToMany(() => CommentReaction, (reaction) => reaction.comment, {
    cascade: true,
  })
  reactions: CommentReaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Método helper para verificar si es un comentario raíz
  isRootComment(): boolean {
    return !this.parentCommentId;
  }

  // Método helper para contar respuestas
  getReplyCount(): number {
    return this.replies?.length || 0;
  }
}