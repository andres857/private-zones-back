export class SendMails {
  id: number;
  to: string;
  subject: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
  updatedAt: Date;
} 