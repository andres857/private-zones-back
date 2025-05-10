import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SendWelcomeCourseDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  course_title: string;

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