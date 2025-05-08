import { Entity, Column, PrimaryGeneratedColumn, OneToMany, JoinColumn, ManyToOne, JoinTable, ManyToMany } from 'typeorm';
import { Tenant } from '../../tenants/entities/tenant.entity';
import { Role } from 'src/roles/entities/role.entity';
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  lastName: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @ManyToOne(() => Tenant, tenant => tenant.users)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;
  
  @Column()
  tenantId: string;

  @ManyToMany(() => Role, role => role.users)
  @JoinTable()
  roles: Role[];
  
} 