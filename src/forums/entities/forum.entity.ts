// src/forums/entities/forum.entity.ts
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
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { ForumComment } from './forum-comment.entity';
import { ForumReaction } from './forum-reaction.entity';
import { Courses } from 'src/courses/entities/courses.entity';

@Entity('forums')
export class Forum {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.forums)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  thumbnail: string | null;

  @Column({ type: 'timestamp', nullable: true })
  expirationDate: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isPinned: boolean;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category: string | null;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @Column({ type: 'int', default: 0 })
  viewCount: number;

  // Relación con Usuario (autor)
  @ManyToOne(() => User, (user) => user.forums)
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Column()
  @Index()
  authorId: string;

  @ManyToOne(() => Courses, course => course.forums, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  @Index()
  courseId: string;

  @OneToMany(() => ForumComment, (comment) => comment.forum, {
    cascade: true,
  })
  comments: ForumComment[];

  @OneToMany(() => ForumReaction, (reaction) => reaction.forum, {
    cascade: true,
  })
  reactions: ForumReaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  // Método helper para verificar si el foro está expirado
  isExpired(): boolean {
    if (!this.expirationDate) return false;
    return new Date() > this.expirationDate;
  }

  // Método helper para contar comentarios
  getCommentCount(): number {
    return this.comments?.length || 0;
  }

  // Método helper para contar reacciones por tipo
  getReactionCount(type?: string): number {
    if (!this.reactions) return 0;
    if (type) {
      return this.reactions.filter(r => r.type === type).length;
    }
    return this.reactions.length;
  }
}