import { IsString, IsNotEmpty, IsNumber, Min, IsOptional, IsIn, ValidateNested, IsArray, IsDateString, IsObject, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToOne, JoinColumn } from 'typeorm';



// DTO para información de pago
export class PaymentInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  unit_amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['day', 'week', 'month', 'year'])
  interval: 'day' | 'week' | 'month' | 'year';
}

// DTO para información de recurrencia
export class RecurringDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['day', 'week', 'month', 'year'])
  interval: string;

  @IsNumber()
  @IsNotEmpty()
  interval_count: number;
}

// DTO para metadata
export class MetadataDto {
  @IsNumber()
  @IsNotEmpty()
  club_id: number;

  @IsNumber()
  @IsNotEmpty()
  created_by: number;
}

// DTO principal que recibes del frontend
export class CreateProductDto {
  @ValidateNested()
  @Type(() => PaymentInfoDto)
  @IsNotEmpty()
  payment_info: PaymentInfoDto;

  @IsNotEmpty()
  club: string; // JSON string del club

  @ValidateNested()
  @Type(() => RecurringDto)
  @IsNotEmpty()
  recurring: RecurringDto;

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsNotEmpty()
  metadata: MetadataDto;
}

// DTO para el club parseado
export class ClubDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNotEmpty()
  @IsNumber()
  public: number;

  @IsNotEmpty()
  @IsNumber()
  client_id: number;

  @IsNotEmpty()
  @IsNumber()
  creator_user: number;

  @IsOptional()
  @IsString()
  imagen?: string;

  @IsNotEmpty()
  @IsDateString()
  created_at: Date;

  @IsNotEmpty()
  @IsNumber()
  check_multiple_sections: number;

  @IsNotEmpty()
  @IsDateString()
  updated_at: Date;

  @IsOptional()
  @IsDateString()
  deleted_at?: Date;

  @IsNotEmpty()
  @IsNumber()
  conference: number;

  @IsNotEmpty()
  @IsString()
  conference_tab: string;

  @IsNotEmpty()
  @IsString()
  conference_tab_icon: string;

  @IsNotEmpty()
  @IsString()
  conference_type: string;

  @IsOptional()
  conference_user?: any;

  @IsOptional()
  @IsObject()
  metadata?: any;

  @IsOptional()
  @IsArray()
  conference_users?: any[];

  @IsNotEmpty()
  @IsString()
  content_view: string;

  @IsOptional()
  @IsString()
  conference_background?: string;

  @IsOptional()
  @IsString()
  es_content?: string;

  @IsOptional()
  @IsString()
  en_content?: string;

  @IsOptional()
  @IsString()
  cover_video?: string;

  @IsOptional()
  @IsString()
  cover_image?: string;

  @IsOptional()
  @IsString()
  es_test?: string;

  @IsOptional()
  @IsString()
  en_test?: string;

  @IsOptional()
  @IsString()
  es_forum?: string;

  @IsOptional()
  @IsString()
  en_forum?: string;

  @IsOptional()
  @IsString()
  es_poll?: string;

  @IsOptional()
  @IsString()
  en_poll?: string;

  @IsOptional()
  @IsString()
  crisp_code?: string;

  @IsNotEmpty()
  @IsNumber()
  index: number;

  @IsOptional()
  @IsString()
  es_task?: string;

  @IsOptional()
  @IsString()
  en_task?: string;

  @IsNotEmpty()
  @IsString()
  conference_tab_en: string;

  @IsOptional()
  group?: any;

  @IsOptional()
  activatebaground?: any;

  @IsOptional()
  @IsString()
  es_group?: string;

  @IsOptional()
  @IsString()
  en_group?: string;

  @IsNotEmpty()
  @IsString()
  group_st: string;

  @IsNotEmpty()
  @IsString()
  es_videoroom: string;

  @IsNotEmpty()
  @IsString()
  en_videoroom: string;

  @IsNotEmpty()
  @IsString()
  es_directchat: string;

  @IsNotEmpty()
  @IsString()
  en_directchat: string;

  @IsNotEmpty()
  @IsString()
  id_secction: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsNotEmpty()
  @IsString()
  ordergroup: string;

  @IsNotEmpty()
  @IsString()
  color_tilte: string;

  @IsOptional()
  notification_whatsapp?: any;

  @IsOptional()
  @IsString()
  es_Activity?: string;

  @IsOptional()
  @IsString()
  en_Activity?: string;

  @IsOptional()
  @IsString()
  es_measurement?: string;

  @IsOptional()
  @IsString()
  en_measurement?: string;

  @IsOptional()
  @IsString()
  video_cover_video_room?: string;

  @IsOptional()
  @IsString()
  description_video_cover_videoroom?: string;

  @IsOptional()
  @IsString()
  title_video_cover_video_room?: string;

  @IsNotEmpty()
  @IsString()
  default_tabl: string;

  @IsNotEmpty()
  @IsNumber()
  inten_hour: number;

  @IsNotEmpty()
  @IsString()
  abbreviation: string;

  @IsNotEmpty()
  @IsNumber()
  check_user_section: number;

  @IsNotEmpty()
  @IsNumber()
  not_visible: number;

  @IsNotEmpty()
  @IsString()
  type_cover: string;

  @IsNotEmpty()
  @IsNumber()
  enable_cover_header: number;

  @IsOptional()
  @IsString()
  image_cover_videoroom?: string;

  @IsOptional()
  @IsString()
  description_image_cover_videoroom?: string;

  @IsOptional()
  @IsString()
  title_image_cover_videoroom?: string;

  @IsNotEmpty()
  @IsString()
  type_cover_footer: string;

  @IsNotEmpty()
  @IsNumber()
  enable_cover_footer: number;

  @IsOptional()
  @IsString()
  image_cover_videoroom_footer?: string;

  @IsOptional()
  @IsString()
  description_image_cover_videoroom_footer?: string;

  @IsOptional()
  @IsString()
  title_image_cover_videoroom_footer?: string;

  @IsOptional()
  @IsString()
  video_cover_videoroom_footer?: string;

  @IsOptional()
  @IsString()
  description_video_cover_videoroom_footer?: string;

  @IsOptional()
  @IsString()
  title_video_cover_videoroom_footer?: string;

  @IsNotEmpty()
  @IsNumber()
  enable_progress_modules: number;

  @IsNotEmpty()
  @IsNumber()
  enable_access_without_order_modules: number;

  @IsNotEmpty()
  @IsString()
  start_date: string;

  @IsNotEmpty()
  @IsString()
  end_date: string;

  @IsNotEmpty()
  @IsBoolean()
  is_payment: boolean;

  @IsNotEmpty()
  @IsString()
  unit_amount: string;

  @IsNotEmpty()
  @IsString()
  recurring: string;

  @IsNotEmpty()
  @IsString()
  currency: string;

  @IsNotEmpty()
  @IsString()
  type_payment: string;

  @IsNotEmpty()
  @IsString()
  image_url: string;

  @IsNotEmpty()
  @IsString()
  title: string; // Este es el que necesitas para el name del producto

  @IsOptional()
  @IsArray()
  translations?: any[];

  @IsOptional()
  @IsArray()
  club_translation?: any[];
}