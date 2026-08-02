import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { Job } from 'bullmq';
import { ResponseUserDto } from '../user/dto/response-user.dto';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
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
      user.name,
      ticketPath,
    );

    this.logger.log(
      `Ticket generated for user ${userId} for event ${eventId}.`,
    );
  }

  private async fetchImage(url?: string | null): Promise<Buffer | null> {
    if (!url) return null;
    try {
      const response = await fetch(url);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  private formatDate(date: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(new Date(date));
  }

  private async createEventPdfTicket(
    event: Event,
    host: Pick<ResponseUserDto, 'avatarUrl' | 'name'>,
    attendee: Pick<ResponseUserDto, 'name' | 'email' | 'id'>,
  ) {
    const [cover, avatar, qr] = await Promise.all([
      this.fetchImage(event.imageUrl),
      this.fetchImage(host.avatarUrl),
      QRCode.toBuffer(`${event.id}---${attendee.email}`, {
        width: 240,
        margin: 1,
      }),
    ]);

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    const finished = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const cardX = 40;
    const cardY = 60;
    const cardWidth = doc.page.width - cardX * 2;
    const cardHeight = cover ? 430 : 300;
    const sideWidth = 160;
    const mainWidth = cardWidth - sideWidth;
    const pad = 28;
    const mainX = cardX + pad;
    const contentWidth = mainWidth - pad * 2;

    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f4f7f6');
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12).fill('#ffffff');

    doc.save();
    doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 12).clip();
    doc.rect(cardX + mainWidth, cardY, sideWidth, cardHeight).fill('#fcfcfc');
    doc.restore();

    let y = cardY + pad;

    if (cover) {
      doc.save();
      try {
        doc.roundedRect(mainX, y, contentWidth, 120, 8).clip();
        doc.image(cover, mainX, y, { cover: [contentWidth, 120] });
        y += 140;
      } catch {
        this.logger.warn(`Unsupported cover image for event ${event.id}`);
      }
      doc.restore();
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(22)
      .fillColor('#222')
      .text(event.title, mainX, y, { width: contentWidth });
    y = doc.y + 8;

    doc
      .font('Helvetica')
      .fontSize(10)
      .fillColor('#777')
      .text(
        `Date : ${this.formatDate(event.startDate)} - ${this.formatDate(event.endDate)}`,
        mainX,
        y,
        { width: contentWidth },
      );
    doc.text(`Lieu : ${event.location}`, mainX, doc.y + 2, {
      width: contentWidth,
    });
    y = doc.y + 14;

    doc.fontSize(11).fillColor('#555').text(event.description, mainX, y, {
      width: contentWidth,
      height: 80,
      ellipsis: true,
      lineGap: 2,
    });

    const infoY = cardY + cardHeight - pad - 46;
    const colWidth = (contentWidth - 20) / 2;
    const hostX = mainX + colWidth + 20;

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#888')
      .text('PARTICIPANT', mainX, infoY, { width: colWidth });
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#333')
      .text(attendee.name, mainX, infoY + 14, { width: colWidth });
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor('#555')
      .text(attendee.email, mainX, doc.y + 1, { width: colWidth });

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .fillColor('#888')
      .text('ORGANISÉ PAR', hostX, infoY, { width: colWidth });

    let hostNameX = hostX;
    if (avatar) {
      doc.save();
      try {
        doc.circle(hostX + 14, infoY + 28, 14).clip();
        doc.image(avatar, hostX, infoY + 14, { cover: [28, 28] });
        hostNameX = hostX + 36;
      } catch {
        this.logger.warn(`Unsupported avatar image for event ${event.id}`);
      }
      doc.restore();
    }
    doc
      .font('Helvetica-Bold')
      .fontSize(12)
      .fillColor('#333')
      .text(host.name, hostNameX, infoY + 20, {
        width: colWidth - (hostNameX - hostX),
      });

    doc
      .save()
      .dash(4, { space: 4 })
      .moveTo(cardX + mainWidth, cardY + 12)
      .lineTo(cardX + mainWidth, cardY + cardHeight - 12)
      .lineWidth(1)
      .strokeColor('#ddd')
      .stroke()
      .undash()
      .restore();

    const sideCenter = cardX + mainWidth + sideWidth / 2;
    const qrSize = 116;
    const qrTop = cardY + (cardHeight - (qrSize + 44)) / 2;
    doc.image(qr, sideCenter - qrSize / 2, qrTop, {
      fit: [qrSize, qrSize],
    });
    doc
      .font('Helvetica')
      .fontSize(11)
      .fillColor('#333')
      .text('Billet Classique', cardX + mainWidth, qrTop + qrSize + 14, {
        width: sideWidth,
        align: 'center',
      });
    doc
      .fontSize(9)
      .fillColor('#999')
      .text(
        `ID: ${(attendee.id + event.id).slice(0, 8).toUpperCase()}`,
        cardX + mainWidth,
        doc.y + 4,
        { width: sideWidth, align: 'center' },
      );

    doc.end();
    const buffer = await finished;

    return this.filesService.uploadPdf(
      buffer,
      `${event.id}-${attendee.id}-ticket.pdf`,
    );
  }
}
