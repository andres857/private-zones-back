import { MailDriver } from '../interfaces/mail-driver.interface';
import { createTransport } from 'nodemailer';

export class SMTP2GODriver implements MailDriver {
  private transporter = createTransport({
    host: 'mail.smtp2go.com',
    port: 2525,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  async sendEmail(to: string, subject: string, html: string) {
    const info = await this.transporter.sendMail({
      from: `"LaCardio" <notificaciones-devel@kalmsystem.com>`,
      to,
      subject,
      html,
    });

    return { messageId: info.messageId };
  }
}