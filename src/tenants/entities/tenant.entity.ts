import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  OneToOne,
  OneToMany
} from 'typeorm';
import { TenantConfig } from './tenant-config.entity';
import { TenantContactInfo } from './tenant-contact-info.entity';
import { TenantViewConfig } from './tenant-view-config.entity';
import { User } from '../../users/entities/user.entity';
import { TenantProduct } from './tenant-product.entity';
import { Subscription } from './suscription-tenant.entity';
import { TenantComponentConfig } from './tenant-component-config.entity';
import { Courses } from 'src/courses/entities/courses.entity';
import { Section } from 'src/sections/entities/sections.entity';
import { ContentItem } from 'src/contents/entities/courses-contents.entity';
import { Forum } from 'src/forums/entities/forum.entity';
import { Task } from 'src/courses/entities/courses-tasks.entity';
import { Quiz } from 'src/courses/entities/courses-quizzes.entity';
import { Survey } from 'src/courses/entities/courses-surveys.entity';

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

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt: Date;

  @OneToOne(() => TenantConfig, config => config.tenant)
  config: TenantConfig;

  @OneToOne(() => TenantContactInfo, contact => contact.tenant)
  contactInfo: TenantContactInfo;

  @OneToMany(() => TenantViewConfig, viewConfig => viewConfig.tenant)
  viewConfigs: TenantViewConfig[];

  @OneToMany(() => TenantComponentConfig, componentConfig => componentConfig.tenant)
  componentConfigs: TenantComponentConfig[];

  @OneToMany(() => User, user => user.tenant)
  users: User[];

  @OneToMany(() => TenantProduct, product => product.tenant)
  products: TenantProduct[];

  @OneToMany(() => Subscription, subscription => subscription.tenant)
  subscriptions: Subscription[];

  @OneToMany(() => Section, section => section.tenant)
  sections: Section[];

  @OneToMany(() => Courses, course => course.tenant)
  courses: Courses[];

  @OneToMany(() => ContentItem, content => content.tenant)
  contents: ContentItem[];

  @OneToMany(() => Forum, forum => forum.tenant)
  forums: Forum[];

  @OneToMany(() => Task, task => task.tenant)
  tasks: Task[];

  @OneToMany(() => Quiz, quiz => quiz.tenant)
  quizzes: Quiz[];

  @OneToMany(() => Survey, survey => survey.tenant)
  surveys: Survey[];

}
