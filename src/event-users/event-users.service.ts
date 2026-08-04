import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventUsersDto } from './dto/create-event-users.dto';
import { EventRole } from '../generated/prisma/client';

@Injectable()
export class EventUsersService {
  constructor(private readonly prisma: PrismaService) {}
  async create(createEventUsersDto: CreateEventUsersDto) {
    const { eventId, userId, ticketTypeId, ...eventUserData } =
      createEventUsersDto;
    const existingAttendee = await this.prisma.eventUser.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    console.log(ticketTypeId, ticketTypeId?.length);
    if (existingAttendee)
      throw new ConflictException(
        'You are already a Participant of this event',
      );
    const attendee = await this.prisma.eventUser.create({
      data: {
        ...eventUserData,
        joinedAt: new Date(),
        event: { connect: { id: eventId } },
        user: { connect: { id: userId } },
        ...(ticketTypeId &&
          ticketTypeId.length > 10 && {
            ticketType: { connect: { id: ticketTypeId } },
          }),
      },
    });
    return attendee;
  }

  async findHost(eventId: string) {
    const host = await this.prisma.eventUser.findFirst({
      where: { eventId, role: EventRole.HOST },
      select: {
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
    if (!host) throw new NotFoundException('Host not found');
    return host;
  }

  async findEventAttendees(id: string) {
    return await this.prisma.eventUser.findMany({
      where: { eventId: id },
      select: {
        role: true,
        user: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }
}
