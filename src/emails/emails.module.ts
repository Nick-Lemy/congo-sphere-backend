import { Module } from '@nestjs/common';
import { EmailsService } from './emails.service';
import { BullModule } from '@nestjs/bullmq';

@Module({
  providers: [EmailsService],
  exports: [EmailsService],
  imports: [
    BullModule.registerQueue({
      name: 'send-email',
    }),
  ],
})
export class EmailsModule {}
