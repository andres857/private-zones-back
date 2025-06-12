// course.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('courses')
export class Course {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    nullable:true
  })
  id_resource_mzg: number;

  @Column()
  title: string;

  @Column()
  name: string;

  @Column({ default: 0 })
  public: number;

  @Column()
  client_id: number;

  @Column()
  creator_user: number;

  @Column({ nullable: true })
  imagen?: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at?: Date;

  @Column({ default: 0 })
  check_multiple_sections?: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updated_at?: Date;

  @Column({ nullable: true, type: 'timestamp' })
  deleted_at?: Date | null;

  @Column({ default: 0 })
  conference?: number;

  @Column({ nullable: true })
  conference_tab?: string;

  @Column({ nullable: true })
  conference_tab_icon?: string;

  @Column({ nullable: true })
  color_tilte?: string;

  @Column({ nullable: true })
  conference_type?: string;

  @Column({ nullable: true })
  conference_user?: string;

  @Column({ nullable: true, type: 'json' })
  metadata?: string;

  @Column({ nullable: true })
  conference_users?: string;

  @Column({ nullable: true })
  content_view?: string;

  @Column({ nullable: true })
  conference_background?: string;

  @Column({ nullable: true, type: 'text' })
  es_content?: string;

  @Column({ nullable: true, type: 'text' })
  en_content?: string;

  @Column({ nullable: true })
  cover_video?: string;

  @Column({ nullable: true })
  cover_image?: string;

  @Column({ nullable: true })
  es_test?: string;

  @Column({ nullable: true })
  en_test?: string;

  @Column({ nullable: true })
  es_forum?: string;

  @Column({ nullable: true })
  en_forum?: string;

  @Column({ nullable: true })
  es_poll?: string;

  @Column({ nullable: true })
  en_poll?: string;

  @Column({ nullable: true })
  crisp_code?: string;

  @Column({ nullable: true })
  index?: number;

  @Column({ nullable: true })
  es_task?: string;

  @Column({ nullable: true })
  en_task?: string;

  @Column({ nullable: true })
  conference_tab_en?: string;

  @Column({ nullable: true })
  activatebaground?: string;

  @Column({ nullable: true, type: 'text' })
  group?: string;

  @Column({ nullable: true })
  es_group?: string;

  @Column({ nullable: true })
  en_group?: string;

  @Column({ nullable: true })
  es_videoroom?: string;

  @Column({ nullable: true })
  en_videoroom?: string;

  @Column({ nullable: true })
  es_directchat?: string;

  @Column({ nullable: true })
  en_directchat?: string;

  @Column({ nullable: true })
  group_st?: string;

  @Column({ nullable: true })
  id_secction?: string;

  @Column({ nullable: true })
  password?: string;

  @Column({ nullable: true })
  ordergroup?: string;

  @Column({ nullable: true })
  notification_whatsapp?: string;

  @Column({ nullable: true })
  es_Activity?: string;

  @Column({ nullable: true })
  en_Activity?: string;

  @Column({ nullable: true })
  es_measurement?: string;

  @Column({ nullable: true })
  en_measurement?: string;

  @Column({ nullable: true })
  video_cover_video_room?: string;

  @Column({ nullable: true })
  description_video_cover_videoroom?: string;

  @Column({ nullable: true })
  title_video_cover_video_room: string;

  @Column({ nullable: true })
  default_tabl: string;

  @Column({ nullable: true })
  inten_hour: string;

  @Column({ nullable: true })
  abbreviation: string;

  @Column({ nullable: true, default: 0 })
  not_visible: number;

  @Column({ nullable: true, default: 'image' })
  type_cover: string;

  @Column({ nullable: true, default: 0 })
  enable_cover_header: number;

  @Column({ nullable: true })
  image_cover_videoroom: string;

  @Column({ nullable: true })
  description_image_cover_videoroom: string;

  @Column({ nullable: true })
  title_image_cover_videoroom: string;

  @Column({ nullable: true, default: 'image' })
  type_cover_footer: string;

  @Column({ nullable: true, default: 0 })
  enable_cover_footer: number;

  @Column({ nullable: true })
  image_cover_videoroom_footer: string;

  @Column({ nullable: true })
  description_image_cover_videoroom_footer: string;

  @Column({ nullable: true })
  title_image_cover_videoroom_footer: string;

  @Column({ nullable: true })
  video_cover_videoroom_footer: string;

  @Column({ nullable: true })
  description_video_cover_videoroom_footer: string;

  @Column({ nullable: true })
  title_video_cover_videoroom_footer: string;

  @Column({ nullable: true, default: 0 })
  enable_progress_modules: number;

  @Column({ nullable: true, default: 0 })
  enable_access_without_order_modules: number;

  @Column({ nullable: true, type: 'date' })
  start_date: Date;

  @Column({ nullable: true, type: 'date' })
  end_date: Date;
}