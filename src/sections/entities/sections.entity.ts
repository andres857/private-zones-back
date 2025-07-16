import { Courses } from 'src/courses/entities/courses.entity';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';

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

    @OneToMany(() => Courses, course => course.section)
    courses: Courses[];
}