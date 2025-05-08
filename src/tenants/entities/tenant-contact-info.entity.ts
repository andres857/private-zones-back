import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToOne,
    JoinColumn
  } from 'typeorm';
  import { Tenant } from './tenant.entity';
  
  @Entity()
  export class TenantContactInfo {
    @PrimaryGeneratedColumn('uuid')
    id: string;
  
    @OneToOne(() => Tenant, tenant => tenant.contactInfo, { onDelete: 'CASCADE' })
    @JoinColumn()
    tenant: Tenant;
  
    @Column()
    contactPerson: string;
  
    @Column()
    contactEmail: string;
  
    @Column()
    phone: string;
  
    @Column()
    address: string;
  }
  