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

    @Column({ default: true})
    status: boolean; // "active - 1", "inactive - 0", "suspended"
  
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

    // campo maximo de usuarios
    @Column({ default: 1000 })
    maxUsers: number;

    // campo maximo de almacenamiento en GB
    @Column({ default: 100 })
    storageLimit: number;

  }
  