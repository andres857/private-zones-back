
import { Tenant } from 'src/tenants/entities/tenant.entity';
import {Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn,DeleteDateColumn, ManyToOne, JoinColumn, Index} from 'typeorm';


@Entity('contents')
export class ContentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.contents)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: ['video', 'image', 'document', 'embed', 'scorm'] })
  contentType: 'video' | 'image' | 'document' | 'embed' | 'scorm';

  @Column({ type: 'text' })
  contentUrl: string;

  @Column({ nullable: true })
  description: string;

  // Metadatos adicionales
  @Column({
      type: 'jsonb',
      default: {}
  })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
