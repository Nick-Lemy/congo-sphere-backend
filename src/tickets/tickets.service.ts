import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TicketsService {
  constructor(private readonly prisma: PrismaService) {}

  async getTickets(userId?: string, eventId?: string) {
    if (eventId) {
      const event = await this.prisma.event.findUnique({
        where: { id: eventId },
      });
      if (!event) {
        throw new NotFoundException('Event not found');
      }
    }

    if (userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    const tickets = await this.prisma.ticket.findMany({
      where: {
        userId: userId,
        eventId: eventId,
      },
    });

    return tickets;
  }

  async getTicketById(userId: string, ticketId: string) {
    const currentUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    if (!currentUser) {
      throw new NotFoundException('User not found');
    }
    const isAdmin = currentUser?.role === 'ADMIN';
    const isTicketOwner = ticket?.userId === userId;
    if (!isAdmin && !isTicketOwner) {
      throw new UnauthorizedException(
        'You do not have permission to access this ticket',
      );
    }
    return ticket;
  }
}
