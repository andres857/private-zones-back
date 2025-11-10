import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToMany,
  OneToMany,
  ManyToOne,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { Tenant } from 'src/tenants/entities/tenant.entity';
import { ContentItem } from 'src/contents/entities/courses-contents.entity';
import { Courses } from 'src/courses/entities/courses.entity';

@Entity('content_categories')
export class ContentCategory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Tenant, tenant => tenant.contentCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column()
  @Index()
  tenantId: string;

  @ManyToOne(() => Courses, course => course.contentCategories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'courseId' })
  course: Courses;

  @Column()
  @Index()
  courseId: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column({default: 0, nullable: true})
  order?: number

  // Metadatos adicionales
  @Column({
      type: 'jsonb',
      default: {}
  })
  metadata: Record<string, any>;

  /**
   * Relación con contenidos
   * Un contenido puede pertenecer a varias categorías
   */
  @ManyToMany(() => ContentItem, content => content.categories, { cascade: true })
  @JoinTable({
    name: 'content_category_items',
    joinColumn: { name: 'categoryId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'contentId', referencedColumnName: 'id' },
  })
  contents: ContentItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
