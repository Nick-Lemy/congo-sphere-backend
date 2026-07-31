import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { FilesService } from '../files/files.service';
import { AuthGuard } from '../auth/auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TicketsController],
  providers: [
    TicketsService,
    FilesService,
    AuthGuard,
    AdminGuard,
    PrismaService,
  ],
  exports: [TicketsService],
})
export class TicketsModule {}
