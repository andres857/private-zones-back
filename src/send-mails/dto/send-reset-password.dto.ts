import { IsEmail, IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class SendResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsEmail()
  email_user: string;

  @IsNotEmpty()
  @IsUrl()
  reset_link: string;

  @IsNotEmpty()
  @IsEmail()
  support_email: string;
}
