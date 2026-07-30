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

@Module({
  providers: [EventsService, PrismaService, FilesService, Logger],
  controllers: [EventsController],
  imports: [
    EventUsersModule,
    EmailsModule,
    TicketsModule,
    UserModule,
    PaymentModule,
  ],
})
export class EventsModule {}
