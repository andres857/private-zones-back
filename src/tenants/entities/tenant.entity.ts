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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @OneToOne(() => TenantConfig, config => config.tenant)
  config: TenantConfig;

  @OneToOne(() => TenantContactInfo, contact => contact.tenant)
  contactInfo: TenantContactInfo;

  @OneToMany(() => User, user => user.tenant)
  users: User[];
}
