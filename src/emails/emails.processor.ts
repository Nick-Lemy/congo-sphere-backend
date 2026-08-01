import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { EmailAttachment } from '../common/types/email.type';
import { createTransport } from 'nodemailer';

export interface SendEmailJob {
  to: string;
  subject: string;
  html: string;
  attachments?: EmailAttachment[];
}
@Processor('send-email', { concurrency: 2 })
export class SendEmailProcessor extends WorkerHost {
  private readonly logger = new Logger(SendEmailProcessor.name);
  constructor() {
    super();
  }
  private createEmailTransporter() {
    return createTransport({
      service: 'Gmail',
      host: process.env.EEMAIL_MAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }
  async process(job: Job<SendEmailJob>) {
    const { to, subject, html, attachments } = job.data;
    await this.sendEmail(to, subject, html, attachments);
    this.logger.log(`Email sent to ${to} with subject "${subject}".`);
  }
  private async sendEmail(
    to: string,
    subject: string,
    html: string,
    attachments?: EmailAttachment[],
  ) {
    const transporter = this.createEmailTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      html,
      subject,
      attachments,
    });
  }
}
