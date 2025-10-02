// src/users/entities/user.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn, OneToOne, Index
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../../auth/entities/token.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { UserConfig } from './user-config.entity';
import { UserProfileConfig } from './user-profile-config.entity';
import { UserNotificationConfig } from './user-notification-config.entity';
import { CoursesUsers } from 'src/courses/entities/courses-users.entity';
import { Forum } from 'src/forums/entities/forum.entity';
import { ForumComment } from 'src/forums/entities/forum-comment.entity';
import { ForumReaction } from 'src/forums/entities/forum-reaction.entity';
import { CommentReaction } from 'src/forums/entities/comment-reaction.entity';

@Entity('users')
@Index(['email', 'tenantId'], { unique: true })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({nullable: true})
  name: string;

  @Column({nullable: true})
  lastName: string;

  @Column({nullable: false})
  email: string;

  @Column({nullable: false})
  @Exclude()
  password: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  tenantId: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  @Exclude()
  passwordResetToken?: string;

  @Column({ nullable: true })
  @Exclude()
  passwordResetExpires?: Date;

  @OneToMany(() => CoursesUsers, courseUser => courseUser.user)
  courseConnections: CoursesUsers[];

  @OneToMany(() => RefreshToken, token => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @ManyToMany(() => Role, role => role.users, { eager: true }) // Eager si siempre lo necesitas
  @JoinTable()
  roles: Role[];

  @OneToOne(() => UserConfig, config => config.user, { cascade: true })
  config: UserConfig;

  // Relaciones con las configuraciones
  @OneToOne(() => UserProfileConfig, config => config.user, { cascade: true })
  profileConfig: UserProfileConfig;

  @OneToOne(() => UserNotificationConfig, config => config.user, { cascade: true })
  notificationConfig: UserNotificationConfig;

  @OneToMany(() => Forum, (forum) => forum.author)
  forums: Forum[];

  @OneToMany(() => ForumComment, (comment) => comment.author)
  comments: ForumComment[];

  @OneToMany(() => ForumReaction, (reaction) => reaction.user)
  forumReactions: ForumReaction[];

  @OneToMany(() => CommentReaction, (reaction) => reaction.user)
  commentReactions: CommentReaction[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  async hashPassword() {
    // Solo hashear si la contraseña no está ya hasheada
    if (this.password && !this.isPasswordHashed()) {
      console.log('Hashing password for user:', this.email);
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    try {
      const result = await bcrypt.compare(attempt, this.password);
      return result;
    } catch (error) {
      console.error('Error comparing password:', error);
      return false;
    }
  }

  private isPasswordHashed(): boolean {
    // Los hashes de bcrypt siempre empiezan con $2b$ y tienen 60 caracteres
    return this.password.startsWith('$2b$') && this.password.length === 60;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(newPassword, salt);
  }
}
