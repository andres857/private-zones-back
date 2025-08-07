import { IsArray, IsBoolean, IsOptional, IsString, IsNumber, IsUUID, Min } from 'class-validator';

export class UpdateSectionDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  thumbnailImagePath?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  order?: number;

  @IsOptional()
  @IsBoolean()
  allowBanner?: boolean;

  @IsOptional()
  @IsString()
  bannerPath?: string;

  // NUEVO: Array de IDs de cursos
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  courseIds?: string[];
}