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
import { TenantProduct } from './tenant-product.entity';

@Entity()
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
  
  @Column()
  tenant_id: string;

  @ManyToOne(() => TenantProduct, product => product.subscriptions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: TenantProduct;

  @Column()
  product_id: string;

  // Datos del usuario de Laravel
  @Column()
  laravel_user_id: string;

  @Column({ nullable: true })
  user_email: string;

  // IDs de Stripe
  @Column()
  stripe_subscription_id: string;

  @Column()
  stripe_customer_id: string;

  @Column()
  stripe_price_id: string;

  // Estado de la suscripción
  @Column()
  status: string; // 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'

  // Fechas importantes
  @Column({ type: 'timestamp' })
  current_period_start: Date;

  @Column({ type: 'timestamp' })
  current_period_end: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_start: Date;

  @Column({ type: 'timestamp', nullable: true })
  trial_end: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceled_at: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  ended_at: Date | null;

  // Información de facturación
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ default: 'USD' })
  currency: string;

  @Column()
  interval: string; // 'month', 'year', etc.

  @Column({ default: 1 })
  interval_count: number;

  // Metadata adicional
  @Column({ type: 'json', nullable: true })
  stripe_metadata: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Método para verificar si la suscripción está activa
  isActive(): boolean {
    const now = new Date();
    return this.status === 'active' && 
           this.current_period_end > now &&
           (!this.canceled_at || this.canceled_at > now);
  }

  // Método para verificar si está en período de prueba
  isInTrial(): boolean {
    if (!this.trial_start || !this.trial_end) {
      return false;
    }
    const now = new Date();
    return now >= this.trial_start && now <= this.trial_end;
  }
}