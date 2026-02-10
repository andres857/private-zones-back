// src/users/entities/user-profile-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    OneToOne, JoinColumn
} from 'typeorm';
import { User } from './user.entity';

export enum DocumentType {
    CC = 'CC',        // Cédula de Ciudadanía (Colombia)
    TI = 'TI',        // Tarjeta de Identidad
    CE = 'CE',        // Cédula de Extranjería
    NIT = 'NIT',      // Número de Identificación Tributaria
    PA = 'PA',        // Pasaporte
    RC = 'RC',        // Registro Civil
    PEP = 'PEP',      // Permiso Especial de Permanencia
    DNI = 'DNI',      // Documento Nacional de Identidad
    ID = 'ID',        // Documento Nacional / Identificación general
    DL = 'DL',        // Licencia de conducción
    SSN = 'SSN',      // Número de Seguridad Social (EE.UU.)
    CURP = 'CURP',    // México
    RUT = 'RUT',      // Chile
    OTHER = 'OTHER',  // Otro tipo
}

@Entity('user-profile-config')
export class UserProfileConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @OneToOne(() => User, user => user.profileConfig, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'userId' })
    user: User;

    // Información del perfil
    @Column({ nullable: true })
    avatarPath: string;

    @Column({ nullable: true })
    bio?: string;

    @Column({ nullable: true })
    phoneNumber?: string;

    @Column({
        type: 'enum',
        enum: DocumentType,
        nullable: true,
    })
    type_document?: DocumentType; // Tipo de documento (DNI, Pasaporte, etc.)

    @Column({ nullable: true })
    documentNumber?: string; // Número de documento de identificación

    @Column({ nullable: true })
    organization?: string; // Nombre de la organización o empresa

    @Column({ nullable: true })
    charge?: string; // Cargo o puesto en la organización


    @Column({ nullable: true })
    gender?: string; // Género del usuario (Masculino, Femenino, Otro)

    @Column({ nullable: true })
    city?: string; // Ciudad de residencia

    @Column({ nullable: true })
    country?: string; // País de residencia

    @Column({ nullable: true })
    address?: string; // Dirección física del usuario

    @Column({ nullable: true })
    dateOfBirth?: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}