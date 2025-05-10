import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SendMailsService } from './send-mails.service';
import { SendMails } from './entities/send-mails.entity';
import { SendMailDto } from './dto/send-mail.dto';

import { SendWelcomeCourseDto } from './dto/send-welcome-course.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';
import { SendProgressReportDto } from './dto/send-monthly-progress-report.dto';

@Controller('mails')
export class SendMailsController {
  constructor(private readonly sendMailsService: SendMailsService) {}

  // @Post()
  // async sendMail(@Body() dto: SendMailDto) {
  //   return this.sendMailsService.send(dto);
  // }

  @Post('welcome')
  async sendWelcomeEmail(@Body() body: SendWelcomeCourseDto) {
    return this.sendMailsService.sendWelcomeEmail(body);
  }

  @Post('reset-password')
  async sendResetPasswordEmail(@Body() body: SendResetPasswordDto) {
    return this.sendMailsService.sendResetPasswordEmail(body);
  }

  @Post('monthly-progress')
  async sendmonthlyProgress(@Body() body: SendProgressReportDto) {
    return this.sendMailsService.SendProgressMonthly(body);
  }
}