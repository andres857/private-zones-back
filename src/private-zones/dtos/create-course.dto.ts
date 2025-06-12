// import { IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { IsArray, IsInt, IsNotEmpty, IsString, ValidateNested, IsOptional, } from 'class-validator';
import { Type } from 'class-transformer';

class PaymentInfoDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsNotEmpty()
  unit_amount: number;

  @IsString()
  @IsNotEmpty()
  currency: string;

  @IsString()
  @IsNotEmpty()
  interval: string;
}

export class CreateCourseDto {

  @IsInt()
  @IsNotEmpty()
  id_resource_mzg?: number;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @IsNotEmpty()
  public: number;

  @IsInt()
  @IsNotEmpty()
  client_id: number;

  @IsInt()
  @IsNotEmpty()
  creator_user: number;

  @IsString()
  @IsOptional()
  imagen?: string;

  @IsString()
  @IsOptional()
  created_at?: string;

  @IsInt()
  @IsNotEmpty()
  check_multiple_sections: number;

  @IsString()
  @IsOptional()
  updated_at?: string;

  @IsString()
  @IsOptional()
  deleted_at?: string | null;

  @IsInt()
  @IsNotEmpty()
  conference: number;

  @IsString()
  @IsOptional()
  conference_tab?: string;

  @IsString()
  @IsOptional()
  conference_tab_icon?: string;

  @IsString()
  @IsOptional()
  color_tilte?: string;

  @IsString()
  @IsOptional()
  conference_type?: string;

  @IsString()
  @IsOptional()
  conference_user?: string | null;

  @IsString()
  @IsOptional()
  metadata?: string;

  @IsString()
  @IsOptional()
  conference_users?: string;

  @IsString()
  @IsOptional()
  content_view?: string;

  @IsString()
  @IsOptional()
  conference_background?: string | null;

  @IsString()
  @IsOptional()
  es_content?: string | null;

  @IsString()
  @IsOptional()
  en_content?: string | null;

  @IsString()
  @IsOptional()
  cover_video?: string | null;

  @IsString()
  @IsOptional()
  cover_image?: string;

  @IsString()
  @IsOptional()
  es_test?: string | null;

  @IsString()
  @IsOptional()
  en_test?: string | null;

  @IsString()
  @IsOptional()
  es_forum?: string | null;

  @IsString()
  @IsOptional()
  en_forum?: string | null;

  @IsString()
  @IsOptional()
  es_poll?: string | null;

  @IsString()
  @IsOptional()
  en_poll?: string | null;

  @IsString()
  @IsOptional()
  crisp_code?: string | null;

  @IsInt()
  @IsOptional()
  index?: number;

  @IsString()
  @IsOptional()
  es_task?: string | null;

  @IsString()
  @IsOptional()
  en_task?: string | null;

  @IsString()
  @IsOptional()
  conference_tab_en?: string;

  @IsString()
  @IsOptional()
  activatebaground?: string | null;

  @IsString()
  @IsOptional()
  group?: string;

  @IsString()
  @IsOptional()
  es_group?: string;

  @IsString()
  @IsOptional()
  en_group?: string;

  @IsString()
  @IsOptional()
  es_videoroom?: string;

  @IsString()
  @IsOptional()
  en_videoroom?: string;

  @IsString()
  @IsOptional()
  es_directchat?: string;

  @IsString()
  @IsOptional()
  en_directchat?: string;

  @IsString()
  @IsOptional()
  group_st?: string;

  @IsString()
  @IsOptional()
  id_secction?: string | null;

  @IsString()
  @IsOptional()
  password?: string | null;

  @IsString()
  @IsOptional()
  ordergroup?: string | null;

  @IsString()
  @IsOptional()
  notification_whatsapp?: string | null;

  @IsString()
  @IsOptional()
  es_Activity?: string | null;

  @IsString()
  @IsOptional()
  en_Activity?: string | null;

  @IsString()
  @IsOptional()
  es_measurement?: string | null;

  @IsString()
  @IsOptional()
  en_measurement?: string | null;

  @IsString()
  @IsOptional()
  video_cover_video_room?: string | null;

  @IsString()
  @IsOptional()
  description_video_cover_videoroom?: string | null;

  @IsString()
  @IsOptional()
  title_video_cover_video_room?: string | null;

  @IsString()
  @IsOptional()
  default_tabl?: string;

  @IsString()
  @IsOptional()
  inten_hour?: string | null;

  @IsString()
  @IsOptional()
  abbreviation?: string | null;

  @IsInt()
  @IsOptional()
  not_visible?: number;

  @IsString()
  @IsOptional()
  type_cover?: string;

  @IsInt()
  @IsOptional()
  enable_cover_header?: number;

  @IsString()
  @IsOptional()
  image_cover_videoroom?: string | null;

  @IsString()
  @IsOptional()
  description_image_cover_videoroom?: string | null;

  @IsString()
  @IsOptional()
  title_image_cover_videoroom?: string | null;

  @IsString()
  @IsOptional()
  type_cover_footer?: string;

  @IsInt()
  @IsOptional()
  enable_cover_footer?: number;

  @IsString()
  @IsOptional()
  image_cover_videoroom_footer?: string | null;

  @IsString()
  @IsOptional()
  description_image_cover_videoroom_footer?: string | null;

  @IsString()
  @IsOptional()
  title_image_cover_videoroom_footer?: string | null;

  @IsString()
  @IsOptional()
  video_cover_videoroom_footer?: string | null;

  @IsString()
  @IsOptional()
  description_video_cover_videoroom_footer?: string | null;

  @IsString()
  @IsOptional()
  title_video_cover_videoroom_footer?: string | null;

  @IsInt()
  @IsOptional()
  enable_progress_modules?: number;

  @IsInt()
  @IsOptional()
  enable_access_without_order_modules?: number;

  @IsString()
  @IsOptional()
  start_date?: string;

  @IsString()
  @IsOptional()
  end_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PaymentInfoDto)
  payment_info: PaymentInfoDto[];
}