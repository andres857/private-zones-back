// src/sections/entities/sections.entity.ts
import { Courses } from 'src/courses/entities/courses.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, ManyToMany } from 'typeorm';

@Entity('sections')
export class Section {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, tenant => tenant.sections)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    tenantId: string;

    @Column({ unique: true })
    slug: string; // ej: "colaboradores"

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true, type: 'text' })
    description: string;

    @Column({ nullable: true })
    thumbnailImagePath: string;

    @Column({nullable: true})
    order: number;

    @Column({default: false})
    allowBanner: boolean;

    @Column({nullable: true})
    bannerPath: string;

    // ManyToMany
    @ManyToMany(() => Courses, course => course.sections)
    courses: Courses[];

    // NUEVO: Método helper para obtener cursos activos
    getActiveCourses(): Courses[] {
        return this.courses?.filter(course => course.isActive) || [];
    }

    // NUEVO: Método helper para verificar si tiene un curso específico
    hasCourse(courseId: string): boolean {
        return this.courses?.some(course => course.id === courseId) || false;
    }
}