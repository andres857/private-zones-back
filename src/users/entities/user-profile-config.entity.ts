// src/users/entities/user-profile-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

@Entity('user-profile-config')
export class UserProfileConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, user => user.profileConfig, { onDelete: 'CASCADE' })
    @JoinColumn()
    user: User;

    // Información del perfil
    @Column({ nullable: true })
    avatarPath: string;

    @Column({ nullable: true })
    bio: string;

    @Column({ nullable: true })
    phoneNumber: string;

    @Column({ nullable: true })
    type_document: string; // Tipo de documento (DNI, Pasaporte, etc.)

    @Column({ nullable: true })
    documentNumber: string; // Número de documento de identificación

    @Column({ nullable: true })
    Organization: string; // Nombre de la organización o empresa

    @Column({ nullable: true })
    Charge: string; // Cargo o puesto en la organización

    @Column({ nullable: true })
    Genger: string; // Género del usuario (Masculino, Femenino, Otro)

    @Column({ nullable: true })
    City: string; // Ciudad de residencia

    @Column({ nullable: true })
    Country: string; // País de residencia

    @Column({ nullable: true })
    address: string; // Dirección física del usuario

    @Column({ nullable: true })
    dateOfBirth: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}