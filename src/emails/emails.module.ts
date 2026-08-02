import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { BullModule } from '@nestjs/bullmq';
import { SendEmailProcessor } from './emails.processor';

@Module({
  providers: [EmailsService, SendEmailProcessor],
  exports: [EmailsService],
  imports: [
    BullModule.registerQueue({
      name: 'send-email',
    }),
  ],
})
export class EmailsModule {}
