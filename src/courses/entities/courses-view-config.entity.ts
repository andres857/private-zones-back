// src/courses/entities/courses-view-config.entity.ts
import {
    Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,
    BeforeInsert, BeforeUpdate, OneToMany, ManyToMany, JoinTable, ManyToOne, JoinColumn,
    OneToOne
} from 'typeorm';

import { Courses } from './courses.entity';

export enum CourseViewType {
    CONTENTS = 'contents',
    FORUMS = 'forums',
    TASKS = 'tasks',
    EVALUATIONS = 'evaluations',
    SURVEYS = 'surveys',
    THEMATIC_ROOMS = 'thematic_rooms',
    LIVE_SESSIONS = 'live_sessions',
    DIDACTIC_ACTIVITIES = 'didactic_activities'
}

export enum BackgroundType {
    COLOR = 'color',
    IMAGE = 'image',
}

export enum CoverType {
    IMAGE = 'image',
    VIDEO = 'video'
}

@Entity('courses_views_config')
export class CoursesViewsConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Courses, course => course.viewsConfig)
    @JoinColumn({ name: 'courseId' })
    course: Courses;

    @Column()
    courseId: string;

    // Tipo de vista del curso
    @Column({
        type: 'enum',
        enum: CourseViewType
    })
    viewType: CourseViewType;

    // Configuración de fondo de la vista
    @Column({
        type: 'enum',
        enum: BackgroundType,
        default: BackgroundType.COLOR
    })
    backgroundType: BackgroundType;

    @Column({ nullable: true })
    backgroundColor: string; // Color hexadecimal ej: #ffffff

    @Column({ nullable: true })
    backgroundImagePath: string; // URL de la imagen de fondo

    // Título personalizado de la vista
    @Column({ nullable: true })
    customTitleEs: string;

    @Column({ nullable: true })
    customTitleEn: string;

    @Column({ nullable: true })
    titleColor: string; // Color del título

    // Configuración de cover de inicio
    @Column({
        type: 'enum',
        enum: CoverType,
        nullable: true
    })
    coverTypeHeader: CoverType;

    @Column({ nullable: true })
    coverImageHeader: string; // URL de la imagen de cover

    @Column({ nullable: true })
    coverVideoHeader: string; // URL del video de cover

    @Column({ nullable: true })
    coverTitleHeader: string; // Título del cover

    @Column({ type: 'text', nullable: true })
    coverDescriptionHeader: string; // Descripción del cover

    // Configuración de cover de pie pagina
    @Column({
        type: 'enum',
        enum: CoverType,
        nullable: true
    })
    coverTypeFooter: CoverType;

    @Column({ nullable: true })
    coverImageFooter: string; // URL de la imagen de cover

    @Column({ nullable: true })
    coverVideoFooter: string; // URL del video de cover

    @Column({ nullable: true })
    coverTitleFooter: string; // Título del cover

    @Column({ type: 'text', nullable: true })
    coverDescriptionFooter: string; // Descripción del cover

    // Configuración adicional
    @Column({ default: true })
    isActive: boolean; // Si la vista está activa

    // Configuración de layout
    @Column({
        type: 'jsonb',
        default: {}
    })
    layoutConfig: {
        allowCoverHeader?: boolean; // Permitir cover de inicio
        allowCoverFooter?: boolean; // Permitir cover de pie
        showTitle?: boolean; // Mostrar título
        showDescription?: boolean; // Mostrar descripción
        customCSS?: string; // CSS personalizado
        additionalSettings?: Record<string, any>; // Configuraciones adicionales
    };

    // Metadatos adicionales específicos por vista
    @Column({
        type: 'jsonb',
        default: {}
    })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Métodos helper
    hasCustomBackground(): boolean {
        return this.backgroundType === BackgroundType.IMAGE && !!this.backgroundImagePath;
    }

    hasCoverHeader(): boolean {
        return !!(this.coverTypeHeader && (this.coverImageHeader || this.coverVideoHeader));
    }

    hasCoverFooter(): boolean {
        return !!(this.coverTypeFooter && (this.coverImageFooter || this.coverVideoFooter));
    }

    getCoverHeaderUrl(): string | null {
        if (this.coverTypeHeader === CoverType.IMAGE) return this.coverImageHeader;
        if (this.coverTypeHeader === CoverType.VIDEO) return this.coverVideoHeader;
        return null;
    }

    getCoverFooterUrl(): string | null {
        if (this.coverTypeFooter === CoverType.IMAGE) return this.coverImageFooter;
        if (this.coverTypeFooter === CoverType.VIDEO) return this.coverVideoFooter;
        return null;
    }

    getBackgroundStyle(): string {
        switch (this.backgroundType) {
            case BackgroundType.COLOR:
                return this.backgroundColor || '#ffffff';
            case BackgroundType.IMAGE:
                return this.backgroundImagePath ? `url(${this.backgroundImagePath})` : '#ffffff';
            default:
                return '#ffffff';
        }
    }

    getDisplayTitle(languageCode: string = 'es'): string {
        const customTitle = languageCode === 'en' ? this.customTitleEn : this.customTitleEs;
        return customTitle || this.getDefaultTitleByViewType(languageCode);
    }

    private getDefaultTitleByViewType(languageCode: string = 'es'): string {
        const defaultTitles = {
            [CourseViewType.CONTENTS]: {
                es: 'Contenidos',
                en: 'Contents'
            },
            [CourseViewType.FORUMS]: {
                es: 'Foros',
                en: 'Forums'
            },
            [CourseViewType.TASKS]: {
                es: 'Tareas',
                en: 'Tasks'
            },
            [CourseViewType.EVALUATIONS]: {
                es: 'Evaluaciones',
                en: 'Evaluations'
            },
            [CourseViewType.SURVEYS]: {
                es: 'Encuestas',
                en: 'Surveys'
            },
            [CourseViewType.THEMATIC_ROOMS]: {
                es: 'Salas Temáticas',
                en: 'Thematic Rooms'
            },
            [CourseViewType.LIVE_SESSIONS]: {
                es: 'Sesiones en Vivo',
                en: 'Live Sessions'
            },
            [CourseViewType.DIDACTIC_ACTIVITIES]: {
                es: 'Actividades Didácticas',
                en: 'Didactic Activities'
            }
        };
        
        const viewTitles = defaultTitles[this.viewType];
        if (!viewTitles) return languageCode === 'en' ? 'Course View' : 'Vista del Curso';
        
        return viewTitles[languageCode] || viewTitles.es || (languageCode === 'en' ? 'Course View' : 'Vista del Curso');
    }
}