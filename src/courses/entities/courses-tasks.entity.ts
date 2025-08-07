
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index, OneToOne } from 'typeorm';
import { TaskConfig } from './courses-tasks-config.entity';


@Entity('tasks')
export class Task {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, tenant => tenant.tasks)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    @Index()
    tenantId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({type: 'timestamp', nullable: true})
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @Column({ nullable: true})
    thumbnailImagePath: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;

    @OneToOne(() => TaskConfig, config => config.taskConfig)
    configuration: TaskConfig;
}
