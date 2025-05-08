import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
  } from 'typeorm';
  import { Tenant } from './tenant.entity';
  
  @Entity()
  export class TenantConfig {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @OneToOne(() => Tenant, tenant => tenant.config, { onDelete: 'CASCADE' })
    @JoinColumn()
    tenant: Tenant;
  
    @Column({ default: '#0052cc' })
    primaryColor: string;
  
    @Column({ default: '#ffffff' })
    secondaryColor: string;
  
    @Column({ default: true })
    showLearningModule: boolean;
  
    @Column({ default: false })
    enableChatSupport: boolean;
  
    @Column({ default: true })
    allowGamification: boolean;
  
    @Column({ nullable: true })
    timezone: string;
  }
  