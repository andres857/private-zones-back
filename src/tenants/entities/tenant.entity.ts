import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany
} from 'typeorm';
import { TenantConfig } from './tenant-config.entity';
import { TenantContactInfo } from './tenant-contact-info.entity';
import { User } from '../../users/entities/user.entity';
import { TenantProduct } from './tenant-product.entity';
import { Subscription } from './suscription-tenant.entity';

@Entity()
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  slug: string; // ej: "cardio"

  @Column({ unique: true })
  domain: string; // ej: "cardio.org" o "cardio.miaplicacion.com"

  @Column({ nullable: true })
  contactEmail: string;

  @Column({ nullable: true })
  plan: string; // "free", "pro", etc.

  // Nueva columna para relacionar con client_id de Laravel
  @Column({ nullable: true, unique: true })
  client_id_mz: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne(() => TenantConfig, config => config.tenant)
  config: TenantConfig;

  @OneToOne(() => TenantContactInfo, contact => contact.tenant)
  contactInfo: TenantContactInfo;

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => TenantProduct, product => product.tenant)
  products: TenantProduct[];

  @OneToMany(() => Subscription, subscription => subscription.tenant)
  subscriptions: Subscription[];

}
