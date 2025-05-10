// send-mails.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SendMailDto } from './dto/send-mail.dto';
import { SMTP2GODriver } from './drivers/smtp2go.driver';
// import { PrivateZonesService } from '../private-zones/private-zones.service';
import { MailDriver } from './interfaces/mail-driver.interface';
import { renderProgresoTemplate, renderTemplate } from './utils/render-template';

// import { SendProgresoMonthlyDto } from './dto/send-progreso-monthly.dto';
import { SendWelcomeCourseDto } from './dto/send-welcome-course.dto';
import { SendResetPasswordDto } from './dto/send-reset-password.dto';


@Injectable()
export class SendMailsService {
  private mailDriver: MailDriver;
  
  constructor() {
    this.mailDriver = new SMTP2GODriver();
  }

  async sendWelcomeEmail(data: any) {
    const subject = 'Bienvenido a CampusVirtual';
    const html = renderTemplate('welcome-course', data);
    const result = await this.mailDriver.sendEmail(data.email_user, subject, html);
    return { success: true, messageId: result.messageId };

  }

  async sendResetPasswordEmail(data: any) {
    const subject = 'Restablece tu contraseña';
    const html = renderTemplate('reset-password', data);
    const result = await this.mailDriver.sendEmail(data.email_user, subject, html);

    return { success: true, messageId: result.messageId };
  }

  async SendProgressMonthly(data: any) {
    const subject = 'Progreso mensual';
    const html = renderTemplate('monthly-progress', data);
    const result = await this.mailDriver.sendEmail(data.email_user, subject, html);

    return { success: true, messageId: result.messageId };
  }

  // async send(dto: SendMailDto) {
  //   // const user = await this.privateZones.findUserByEmail(dto.to);
  //   // if (!user) throw new UnauthorizedException('Usuario no válido');

  //   const subject = this.getSubject(dto.type);
  //   // const html = this.renderTemplate(dto.type, dto.data);
  //   // const html = renderProgresoTemplate({
  //   //   title: 'Progreso mensual',
  //   //   name: 'Andrés Guerrero',
  //   //   body: 'Aquí tienes tu progreso actualizado:',
  //   //   clubProgress: [
  //   //     { club_title: 'Curso 1', progress: '70%' },
  //   //     { club_title: 'Curso 2', progress: '20%' },
  //   //   ],
  //   //   email_user: 'andres@lacardio.org',
  //   //   identification: '1098765432',
  //   //   login_link: 'https://formacionvirtual.clinicaupb.org.co/',
  //   //   tutorial_link: 'https://myzonego.nyc3.cdn.digitaloceanspaces.com/ClinicaBolivariana/tutorialplataforma.mp4',
  //   //   support_email: 'formacionvirtual.cub@upb.edu.co',
  //   // });

  //   const result = await this.mailDriver.sendEmail(dto.to, subject, html);
  //   return { success: true, messageId: result.messageId };
  // }


}
