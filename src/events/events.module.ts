import { Logger, Module } from '@nestjs/common';
import { EventsService } from './events.service';
import { EventsController } from './events.controller';
import { PrismaService } from '../prisma/prisma.service';
import { EventUsersModule } from '../event-users/event-users.module';
import { FilesService } from '../files/files.service';
import { EmailsModule } from '../emails/emails.module';
import { TicketsModule } from '../tickets/tickets.module';
import { UserModule } from '../user/user.module';
import { PaymentModule } from '../payment/payment.module';
import { BullModule } from '@nestjs/bullmq';
import { RegistrationTicketProcessor } from './registration-ticket.processor';

@Module({
  providers: [
    EventsService,
    PrismaService,
    FilesService,
    Logger,
    RegistrationTicketProcessor,
  ],
  controllers: [EventsController],
  imports: [
    EventUsersModule,
    EmailsModule,
    TicketsModule,
    UserModule,
    PaymentModule,
    BullModule.registerQueue({
      name: 'registration-ticket',
    }),
  ],
})
export class EventsModule {}
