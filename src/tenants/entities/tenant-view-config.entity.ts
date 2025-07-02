import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';
import { Tenant } from './tenant.entity';

export enum ViewType {
    LOGIN = 'login',
    REGISTER = 'register',
    HOME = 'home',
    METRICS = 'metrics',
    OPTIONS = 'options',
    CUSTOMERS = 'customers',
    USERS = 'users',
    COURSES = 'courses',
    SECTIONS = 'sections',
    FREQUENTLYASK = 'frequentlyask',
    DOCUMENTS = 'documents',
    FACETOFACE = 'facetoface',
    VIDEOCALLS = 'videocalls',
}

export enum ContentType {
    TEXT = 'text',
    HTML = 'html',
    VIDEO = 'video',
    IMAGE = 'image',
    CAROUSEL = 'carousel'
}

@Entity()
export class TenantViewConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
    @JoinColumn()
    tenant: Tenant;

    // Tipo de vista que se está configurando
    @Column({
        type: 'enum',
        enum: ViewType,
        nullable: false
    })
    viewType: ViewType;

    // Configuración de titulo y descripción personalizada
    @Column({ nullable: true })
    title: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    // configuracion enum de tipo de fondo
    @Column({
        type: 'enum',
        enum: ['image', 'color', 'none'],
        default: 'none'
    })
    backgroundType: 'image' | 'color' | 'none';

    @Column({ nullable: true })
    backgroundImagePath: string;

    @Column({ nullable: true })
    backgroundColor: string;

    // Contenido informativo de bienvenida
    @Column({ nullable: true })
    welcomeTitle: string;

    @Column({ nullable: true, type: 'text' })
    welcomeMessage: string;

    @Column({
        type: 'enum',
        enum: ContentType,
        default: ContentType.TEXT
    })
    welcomeContentType: ContentType;

    // Videos informativos
    @Column({ nullable: true })
    introVideoUrl: string;

    @Column({ nullable: true })
    tutorialVideoUrl: string;

    @Column({ default: false })
    autoplayVideo: boolean;

    @Column({ default: true })
    showVideoControls: boolean;

    // Texto informativo adicional
    @Column({ nullable: true, type: 'text' })
    instructionsText: string;

    @Column({ nullable: true, type: 'text' })
    helpText: string;

    @Column({ nullable: true, type: 'text' })
    disclaimerText: string;

    // Enlaces útiles
    @Column({ nullable: true })
    helpUrl: string;

    @Column({ nullable: true })
    documentationUrl: string;

    @Column({ nullable: true })
    supportUrl: string;

    // campo de configuraciones adicionales
    @Column({ nullable: true, type: 'jsonb' })
    additionalSettings: Record<string, any>;

    // Estados
    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}