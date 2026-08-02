import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { FilesService } from '../files/files.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';
import { BullModule } from '@nestjs/bullmq';
import { TicketGenerationProcessor } from './tickets.processor';
import { EmailsModule } from '../emails/emails.module';

@Module({
  controllers: [TicketsController],
  providers: [
    TicketsService,
    FilesService,
    AuthGuard,
    AdminGuard,
    PrismaService,
    TicketGenerationProcessor,
  ],
  exports: [TicketsService],
  imports: [
    EmailsModule,
    BullModule.registerQueue({
      name: 'ticket-generation',
    }),
  ],
})
export class TicketsModule {}
