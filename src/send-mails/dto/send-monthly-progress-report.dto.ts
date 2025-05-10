import { IsEmail, IsNotEmpty, IsString, IsUrl, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

class ClubProgressDto {
  @IsNotEmpty()
  @IsString()
  club_title: string;

  @IsNotEmpty()
  @IsString() // podrías usar una regex si quieres restringir a formato tipo "70%"
  progress: string;
}

export class SendProgressReportDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClubProgressDto)
  clubProgress: ClubProgressDto[];

  @IsNotEmpty()
  @IsEmail()
  email_user: string;

  @IsNotEmpty()
  @IsString()
  identification: string;

  @IsNotEmpty()
  @IsUrl()
  login_link: string;

  @IsNotEmpty()
  @IsUrl()
  tutorial_link: string;

  @IsNotEmpty()
  @IsEmail()
  support_email: string;
}
