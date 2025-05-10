import { Module } from '@nestjs/common';
import { SendMailsController } from './send-mails.controller';
import { SendMailsService } from './send-mails.service';

@Module({
  controllers: [SendMailsController],
  providers: [SendMailsService],
  exports: [SendMailsService],
})
export class SendMailsModule {} 