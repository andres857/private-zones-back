// src/users/entities/user.entity.ts
import {
  Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
  BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn, OneToOne
} from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { RefreshToken } from '../../auth/entities/token.entity';
import { Role } from 'src/roles/entities/role.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { UserConfig } from './user-config.entity';
import { UserProfileConfig } from './user-profile-config.entity';
import { UserNotificationConfig } from './user-notification-config.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
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

  @OneToMany(() => RefreshToken, token => token.user, { cascade: true })
  refreshTokens: RefreshToken[];

  @ManyToMany(() => Role, role => role.users, { eager: true }) // Eager si siempre lo necesitas
  @JoinTable()
  roles: Role[];

  // Relaciones con las configuraciones
  @OneToOne(() => UserProfileConfig, config => config.user, { cascade: true })
  profileConfig: UserProfileConfig;

  @OneToOne(() => UserNotificationConfig, config => config.user, { cascade: true })
  notificationConfig: UserNotificationConfig;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(attempt: string): Promise<boolean> {
    return bcrypt.compare(attempt, this.password);
  }
}
