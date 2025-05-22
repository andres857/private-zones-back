import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested
} from 'class-validator';

class ClubTranslationDto {
  @IsInt()
  id: number;

  @IsString()
  created_at: string;

  @IsString()
  updated_at: string;

  @IsInt()
  club_id: number;

  @IsString()
  locale: string;

  @IsString()
  title: string;
}

class ClubDto {
  @ValidateNested({ each: true })
  @Type(() => ClubTranslationDto)
  @IsArray()
  club_translation: ClubTranslationDto[];

  @IsInt()
  id: number;

  @IsString()
  name: string;

  @IsInt()
  public: number;

  @IsInt()
  client_id: number;

  @IsInt()
  creator_user: number;

  @IsString()
  imagen: string;

  @IsString()
  created_at: string;

  @IsInt()
  check_multiple_sections: number;

  @IsString()
  updated_at: string;

  @IsOptional()
  @IsString()
  deleted_at: string | null;

  @IsInt()
  conference: number;

  @IsString()
  conference_tab: string;

  @IsString()
  conference_tab_icon: string;

  @IsString()
  conference_type: string;

  @IsOptional()
  @IsString()
  conference_user: string | null;

  @IsString()
  metadata: string;

  @IsString()
  conference_users: string;

  @IsString()
  content_view: string;

  @IsOptional()
  @IsString()
  conference_background: string | null;

  @IsOptional()
  @IsString()
  es_content: string | null;

  @IsOptional()
  @IsString()
  en_content: string | null;

  @IsOptional()
  @IsString()
  cover_video: string | null;

  @IsString()
  cover_image: string;

  @IsOptional()
  @IsString()
  es_test: string | null;

  @IsOptional()
  @IsString()
  en_test: string | null;

  @IsOptional()
  @IsString()
  es_forum: string | null;

  @IsOptional()
  @IsString()
  en_forum: string | null;

  @IsOptional()
  @IsString()
  es_poll: string | null;

  @IsOptional()
  @IsString()
  en_poll: string | null;

  @IsOptional()
  @IsString()
  crisp_code: string | null;

  @IsInt()
  index: number;

  @IsOptional()
  @IsString()
  es_task: string | null;

  @IsOptional()
  @IsString()
  en_task: string | null;

  @IsString()
  conference_tab_en: string;

  @IsOptional()
  @IsString()
  activatebaground: string | null;

  @IsString()
  group: string;

  @IsString()
  es_group: string;

  @IsString()
  en_group: string;

  @IsString()
  es_videoroom: string;

  @IsString()
  en_videoroom: string;

  @IsString()
  es_directchat: string;

  @IsString()
  en_directchat: string;

  @IsString()
  group_st: string;

  @IsOptional()
  @IsInt()
  id_secction: number | null;

  @IsOptional()
  @IsString()
  password: string | null;

  @IsOptional()
  @IsString()
  ordergroup: string | null;

  @IsString()
  color_tilte: string;

  @IsOptional()
  @IsString()
  notification_whatsapp: string | null;

  @IsOptional()
  @IsString()
  es_Activity: string | null;

  @IsOptional()
  @IsString()
  en_Activity: string | null;

  @IsOptional()
  @IsString()
  es_measurement: string | null;

  @IsOptional()
  @IsString()
  en_measurement: string | null;

  @IsOptional()
  @IsString()
  video_cover_video_room: string | null;

  @IsOptional()
  @IsString()
  description_video_cover_videoroom: string | null;

  @IsOptional()
  @IsString()
  title_video_cover_video_room: string | null;

  @IsString()
  default_tabl: string;

  @IsOptional()
  @IsString()
  inten_hour: string | null;

  @IsOptional()
  @IsString()
  abbreviation: string | null;

  @IsInt()
  not_visible: number;

  @IsString()
  type_cover: string;

  @IsInt()
  enable_cover_header: number;

  @IsOptional()
  @IsString()
  image_cover_videoroom: string | null;

  @IsOptional()
  @IsString()
  description_image_cover_videoroom: string | null;

  @IsOptional()
  @IsString()
  title_image_cover_videoroom: string | null;

  @IsString()
  type_cover_footer: string;

  @IsInt()
  enable_cover_footer: number;

  @IsOptional()
  @IsString()
  image_cover_videoroom_footer: string | null;

  @IsOptional()
  @IsString()
  description_image_cover_videoroom_footer: string | null;

  @IsOptional()
  @IsString()
  title_image_cover_videoroom_footer: string | null;

  @IsOptional()
  @IsString()
  video_cover_videoroom_footer: string | null;

  @IsOptional()
  @IsString()
  description_video_cover_videoroom_footer: string | null;

  @IsOptional()
  @IsString()
  title_video_cover_videoroom_footer: string | null;

  @IsInt()
  enable_progress_modules: number;

  @IsInt()
  enable_access_without_order_modules: number;

  @IsString()
  start_date: string;

  @IsString()
  end_date: string;
}

export class CreateCourseDto {
  @ValidateNested({ each: true })
  @Type(() => ClubDto)
  @IsArray()
  clubs: ClubDto[];
}
