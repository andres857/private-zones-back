import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { Tenant } from './tenant.entity';

@Entity()
export class TenantProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.products, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column()
  tenant_id: string;

  // ID del plan de Laravel
  @Column()
  laravel_plan_id: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  type_payment: string; // 'one_time', 'subscription'

  @Column({ type: 'json', nullable: true })
  recurring: any;

  @Column({ type: 'json', nullable: true })
  features: string[];

  @Column({ nullable: true })
  max_users: number;

  @Column({ nullable: true })
  max_storage_gb: number;

  @Column({ type: 'json', nullable: true })
  modules_access: string[];

  @Column({ default: true })
  is_active: boolean;

  @Column({ default: false })
  is_popular: boolean;

  @Column({ default: false })
  is_featured: boolean;

  @Column({ nullable: true })
  trial_period_days: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  setup_fee: number;

  // IDs de Stripe
  @Column({ nullable: true })
  stripe_product_id: string;

  @Column({ nullable: true })
  stripe_price_id: string;

  @Column({ type: 'json', nullable: true })
  stripe_metadata: any;

  @Column({ default: 'active' })
  status: string; // 'active', 'inactive', 'deleted'

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}