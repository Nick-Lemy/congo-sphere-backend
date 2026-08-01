import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { Job } from 'bullmq';
import { ResponseUserDto } from '../user/dto/response-user.dto';
import puppeteer from 'puppeteer/lib/esm/puppeteer/puppeteer.js';
import { FilesService } from '../files/files.service';
import { Event } from '../generated/prisma/client';

export interface TicketGenerationJob {
  eventId: string;
  userId: string;
  ticketId: string;
}

@Processor('ticket-generation', { concurrency: 2 })
export class TicketGenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(TicketGenerationProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly filesService: FilesService,
  ) {
    super();
  }
  async process(job: Job<TicketGenerationJob>) {
    const { eventId, userId, ticketId } = job.data;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: { where: { role: 'HOST' }, select: { user: true } },
      },
    });
    if (!event)
      return this.logger.error(
        `Event with ID ${eventId} not found. Skipping ticket generation.`,
      );

    const {
      participants: [{ user: host }],
    } = event;
    if (!host)
      return this.logger.error(
        `Host for event ID ${eventId} not found. Skipping ticket generation.`,
      );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user)
      return this.logger.error(
        `User with ID ${userId} not found. Skipping ticket generation.`,
      );
    const ticketPath = await this.createEventPdfTicket(event, host, user);

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { ticketUrl: ticketPath },
    });

    await this.emailsService.sendEventRegistrationEmail(
      user.email,
      event.title,
      event.id,
      ticketPath,
    );

    this.logger.log(
      `Ticket generated for user ${userId} for event ${eventId}.`,
    );
  }
  private eventTicketTemplate = (
    event: Event,
    host: Pick<ResponseUserDto, 'avatarUrl' | 'name'>,
    attendee: Pick<ResponseUserDto, 'name' | 'email' | 'id'>,
  ) => {
    return `
        <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
          background-color: #f4f7f6;
          margin: 0;
          padding: 40px;
          color: #333;
        }
        .ticket-wrapper {
          display: flex;
          background: #ffffff;
          border-radius: 12px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          max-width: 800px;
          margin: 0 auto;
          overflow: hidden;
        }
        .ticket-main {
          padding: 40px;
          flex: 1;
          border-right: 2px dashed #ddd; /* Tear-off effect */
        }
        .ticket-side {
          padding: 40px 30px;
          background-color: #fcfcfc;
          width: 200px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
        }
        .event-image {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        h1.title {
          font-size: 28px;
          color: #222;
          margin-bottom: 5px;
          margin-top: 0;
        }
        .location, .dates {
          font-size: 14px;
          color: #777;
          margin-bottom: 5px;
        }
        .description {
          font-size: 15px;
          color: #555;
          margin-top: 20px;
          margin-bottom: 30px;
          line-height: 1.5;
        }
        .info-grid {
          display: flex;
          gap: 40px;
        }
        .info-block {
          display: flex;
          flex-direction: column;
        }
        .info-label {
          font-size: 12px;
          text-transform: uppercase;
          color: #888;
          font-weight: bold;
          margin-bottom: -5px;
        }
        .host-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 2px solid #ddd;
          margin-right: 10px;
          vertical-align: middle;
        }
        .qr-placeholder {
          width: 140px;
          height: 140px;
          background: #eee;
          border: 1px solid #ccc;
          margin-bottom: 15px;
        }
        .ticket-id {
          font-size: 12px;
          color: #999;
          letter-spacing: 1px;
        }
      </style>
    </head>
    <body>
      <div class="ticket-wrapper">
        <div class="ticket-main">
          ${event.imageUrl ? `<img src="${event.imageUrl}" alt="Event Cover" class="event-image">` : ''}
          <h1 class="title">${event.title}</h1>
          <div class="dates">🗓️ ${String(event.startDate)} - ${String(event.endDate)}</div>
          <div class="location">📍 ${event.location}</div>
          
          <div class="description">
            ${event.description}
          </div>

          <div class="info-grid">
            <div class="info-block">
              <span class="info-label">Participant</span>
              <p><strong>${attendee.name}</strong><br><span style="font-size:13px; color:#555;">${attendee.email}</span></p>
            </div>
            <div class="info-block">
              <span class="info-label">Organisé par</span>
              <p>
                ${host.avatarUrl ? `<img src="${host.avatarUrl}" class="host-avatar">` : ''}
                <strong>${host.name}</strong>
              </p>
            </div>
          </div>
        </div>
        
        <div class="ticket-side">
          <!-- Placeholder for an actual QR Code if you implement one -->
          <div class="qr-placeholder">
             <!-- An image tag pointing to a dynamic QR generator can go here -->
             <img src="https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=${event.id}---${attendee.email}" alt="QR Code" width="140" height="140">
          </div>
          <div>Billet Classique</div>
          <div class="ticket-id">ID: ${(attendee.id + event.id).slice(0, 8)}</div>
        </div>
      </div>
    </body>
    </html>
    `;
  };

  private async createEventPdfTicket(
    event: Event,
    host: Pick<ResponseUserDto, 'avatarUrl' | 'name'>,
    attendee: Pick<ResponseUserDto, 'name' | 'email' | 'id'>,
  ) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    const content = this.eventTicketTemplate(event, host, attendee);
    await page.setContent(content);
    const ticket = await page.pdf({ format: 'A4' });
    await browser.close();

    const ticketPath = await this.filesService.uploadPdf(
      Buffer.from(ticket),
      `${event.id}-${attendee.id}-ticket.pdf`,
    );
    return ticketPath;
  }
}
