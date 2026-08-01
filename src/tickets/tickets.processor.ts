import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailsService } from '../emails/emails.service';
import { TicketsService } from './tickets.service';
import { Job } from 'bullmq';

export interface RegistrationTicketJob {
  eventId: string;
  userId: string;
  ticketId: string;
}

@Processor('registration-ticket', { concurrency: 2 })
export class RegistrationTicketProcessor extends WorkerHost {
  private readonly logger = new Logger(RegistrationTicketProcessor.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailsService: EmailsService,
    private readonly ticketsService: TicketsService,
  ) {
    super();
  }
  async process(job: Job<RegistrationTicketJob>) {
    const { eventId, userId, ticketId } = job.data;

    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: {
        participants: { where: { role: 'HOST' }, select: { user: true } },
      },
    });
    if (!event)
      throw new NotFoundException(`Event with ID ${eventId} not found.`);

    const {
      participants: [{ user: host }],
    } = event;
    if (!host)
      throw new NotFoundException(`Host for event ID ${eventId} not found.`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found.`);
    const ticketPath = await this.ticketsService.createEventPdfTicket(
      event,
      host,
      user,
    );

    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: { ticketUrl: ticketPath },
    });

    await this.emailsService.sendEventRegistrationEmail(
      user.email,
      event.title,
      user.name,
      event.id,
      [{ filename: `ticket_${user.id}.pdf`, path: ticketPath }],
    );

    this.logger.log(
      `Sent registration ticket for user ${userId} for event ${eventId}.`,
    );
  }
}
