import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtPayload } from '../common/types/jtw.type';
import { EventUsersService } from '../event-users/event-users.service';
import { EventRole } from '../generated/prisma/enums';
import { FilesService } from '../files/files.service';
import { EmailsService } from '../emails/emails.service';
import { TicketsService } from '../tickets/tickets.service';
import { UserService } from '../user/user.service';
import { PaymentService } from '../payment/payment.service';
import { InjectQueue } from '@nestjs/bullmq';
import { RegistrationTicketJob } from './registration-ticket.processor';
import { Queue } from 'bullmq';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventUsersService: EventUsersService,
    private readonly filesService: FilesService,
    private readonly emailsService: EmailsService,
    private readonly ticketsService: TicketsService,
    private readonly userService: UserService,
    private readonly paymentService: PaymentService,
    @InjectQueue('registration-ticket')
    private readonly registrationTicketQueue: Queue<RegistrationTicketJob>,
    private readonly logger: Logger,
  ) {}

  async create(
    currentUser: JwtPayload,
    createEventDto: CreateEventDto,
    file: Express.Multer.File,
  ) {
    const imageUrl = await this.filesService.uploadImage(
      file.buffer,
      file.originalname,
    );
    const { ticketTypes, ...eventData } = createEventDto;

    const event = await this.prisma.$transaction(async (tx) => {
      const event = await tx.event.create({
        data: { ...eventData, imageUrl },
      });
      await tx.eventUser.create({
        data: {
          eventId: event.id,
          userId: currentUser.sub,
          role: EventRole.HOST,
        },
      });
      if (ticketTypes && ticketTypes.length > 0) {
        await tx.ticketType.createMany({
          data:
            ticketTypes?.map((ticket) => ({
              ...ticket,
              eventId: event.id,
            })) || [],
        });
      }

      return event;
    });
    return event;
  }

  findAll() {
    return this.prisma.event.findMany({
      include: {
        participants: {
          where: { role: EventRole.HOST },
          select: {
            role: true,
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string) {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: {
        participants: {
          select: {
            role: true,
            user: {
              select: { id: true, name: true, email: true, avatarUrl: true },
            },
          },
        },
        ticketTypes: { select: { name: true, price: true, id: true } },
      },
    });

    if (!event) throw new NotFoundException('Event not found!');
    return event;
  }

  async update(
    id: string,
    updateEventDto: UpdateEventDto,
    user: JwtPayload,
    file?: Express.Multer.File,
  ) {
    const event = await this.findOne(id);
    const { user: host } = await this.eventUsersService.findHost(id);
    if (host.id !== user.sub || user.role !== 'ADMIN')
      throw new ConflictException(
        'Only the host and admin can update the event!',
      );
    if (file) {
      const imageUrl = await this.filesService.uploadImage(
        file.buffer,
        file.originalname,
      );
      updateEventDto.imageUrl = imageUrl;
    }
    return this.prisma.event.update({
      where: { id: event.id },
      data: updateEventDto,
    });
  }

  async delete(id: string, user: JwtPayload) {
    const event = await this.findOne(id);
    const { user: host } = await this.eventUsersService.findHost(id);
    if (host.id !== user.sub || user.role !== 'ADMIN')
      throw new ConflictException(
        'Only the host and admin can delete the event!',
      );

    return this.prisma.event.delete({ where: { id: event.id } });
  }

  async registerToEvent(
    eventId: string,
    user: JwtPayload,
    ticketTypeId: string,
  ) {
    const { attendee, event, currentUser, ticketId } =
      await this.prisma.$transaction(async (tx) => {
        const event = await tx.event.findUnique({
          where: { id: eventId },
          include: { participants: { include: { user: true } } },
        });
        if (!event) throw new NotFoundException('Event not found!');

        const currentUser = await tx.user.findUnique({
          where: { id: user.sub },
        });
        if (!currentUser) throw new NotFoundException('User not found!');

        const attendee = await tx.eventUser.create({
          data: {
            eventId: event.id,
            userId: currentUser.id,
            role: EventRole.ATTENDEE,
            joinedAt: new Date(),
          },
        });
        const { id: ticketId } = await tx.ticket.create({
          data: {
            eventId: event.id,
            ticketTypeId: ticketTypeId,
            userId: currentUser.id,
          },
        });
        return { attendee, event, currentUser, ticketId };
      });
    await this.registrationTicketQueue.add('send-ticket', {
      eventId: event.id,
      ticketId: ticketId,
      userId: currentUser.id,
    });

    return attendee;
  }

  async cancelRegistration(eventId: string, user: JwtPayload) {
    const attendee = await this.prisma.eventUser.findFirst({
      where: { eventId, userId: user.sub },
    });

    if (!attendee) throw new NotFoundException('Attendee not found!');
    if (attendee.role === EventRole.HOST)
      throw new ConflictException("Admin Can't Cancell registration");

    return this.prisma.eventUser.delete({
      where: { userId_eventId: { userId: user.sub, eventId } },
    });
  }

  async findHost(id: string) {
    return this.eventUsersService.findHost(id);
  }

  async findAllAttendees(id: string) {
    return await this.eventUsersService.findEventAttendees(id);
  }
}
