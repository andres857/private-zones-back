// src/users/entities/user-notification-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('user-notification-config')
export class UserNotificationConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, user => user.notificationConfig, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    // Configuraciones generales de notificaciones
    @Column({ default: true })
    enableNotifications: boolean;

    @Column({ default: false })
    smsNotifications: boolean;

    @Column({ default: false })
    browserNotifications: boolean;

    // Categorías de notificaciones
    @Column({ default: true })
    securityAlerts: boolean;

    @Column({ default: false })
    accountUpdates: boolean;

    @Column({ default: true })
    systemUpdates: boolean;

    @Column({ default: false })
    marketingEmails: boolean;

    @Column({ default: false })
    newsletterEmails: boolean;

    @Column({ default: true })
    reminders: boolean;

    @Column({ default: true })
    mentions: boolean;

    @Column({ default: true })
    directMessages: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}