export interface MailDriver {
    sendEmail(to: string, subject: string, html: string): Promise<{ messageId: string }>;
}