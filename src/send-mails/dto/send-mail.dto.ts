import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SendMailDto {
  @IsEmail()
  to: string;

  @IsString()
  @IsNotEmpty()
  type: 'reset-password' | 'welcome'; // subject

  @IsNotEmpty()
  data: Record<string, any>;
}