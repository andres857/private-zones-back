
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index } from 'typeorm';


@Entity('forums')
export class Forum {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Tenant, tenant => tenant.forums)
    @JoinColumn({ name: 'tenantId' })
    tenant: Tenant;

    @Column()
    @Index()
    tenantId: string;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column({ type: 'text', nullable: true })
    discution: string;

    @Column({ nullable: true})
    thumbnailImagePath: string;

    @Column({type: 'timestamp', nullable: true})
    startDate: Date;

    @Column({ type: 'timestamp', nullable: true })
    endDate: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
