
import { Tenant } from 'src/tenants/entities/tenant.entity';
import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,DeleteDateColumn, ManyToOne, JoinColumn, Index} from 'typeorm';


@Entity('quizzes')
export class Quiz {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.quizzes)
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
