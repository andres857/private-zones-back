
import { Tenant } from 'src/tenants/entities/tenant.entity';
import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,DeleteDateColumn, ManyToOne, JoinColumn, Index} from 'typeorm';


@Entity('surveys')
export class Survey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.surveys)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
