import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { BullModule } from '@nestjs/bullmq';
import { InitiatePaymentDepositProcessor } from './payment.processor';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService, InitiatePaymentDepositProcessor],
  exports: [PaymentService],
  imports: [
    BullModule.registerQueue({
      name: 'initiate-payment-deposit',
    }),
  ],
})
export class PaymentModule {}
