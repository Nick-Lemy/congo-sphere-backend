import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PaymentProvider } from '../common/types/payment.types';
import { InitiateDepositResponseDto } from './dto/initiate-deposit-response.dto';
import { randomUUID } from 'crypto';
import { CheckDepositStatusResponseDto } from './dto/status-check-deposit-response.dto';
import { ResendDepositResponseDto } from './dto/resend-deposit-response.dto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { InitiatePaymentDepositJob } from './payment.processor';

@Injectable()
export class PaymentService {
  private readonly PAWAPAY_URL = process.env.PAWAPAY_URL + '/v2';
  private readonly API_TOKEN = process.env.PAWAPAY_API_TOKEN;
  private readonly COUNTRY = 'COG'
  private readonly PAYER_TYPE = 'MMO';
  private readonly CURRENCY = 'XAF';
  private readonly ticketPaymentMessage = 'Paiement du ticket';

  constructor(
    @InjectQueue('initiate-payment-deposit') 
    private readonly initiatePaymentDepositQueue: Queue<InitiatePaymentDepositJob>
  ){}

  async initiateDeposit(
    userId: string,
    entityId: string,
    entityName: string,
    amount: string,
    phoneNumber: string,
    customerMessage: string,
  ) {
    const paymentProvider = this.predictProvider(phoneNumber);
    const depositId = randomUUID();
    const customerTimestamp = new Date().toISOString();
    try {
      const response = await fetch(`${this.PAWAPAY_URL}/deposits`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          depositId,
          amount,
          currency: this.CURRENCY,
          correspondent: paymentProvider,
          payer: {
            type: this.PAYER_TYPE,
            address: {
              phoneNumber: phoneNumber,
            },
          },
          metadata: [
            {
              fieldName: entityName,
              fieldValue: entityId,
            },
            {
              fieldName: 'userId',
              fieldValue: userId,
              isPII: true
            }
          ],
          customerTimestamp,
          country: this.COUNTRY,
          statementDescription: customerMessage,
        }),
      });
      const data = (await response.json()) as InitiateDepositResponseDto;
      return data;
    } catch (error) {
      console.warn('Error while initiating deposit', error);
      throw new InternalServerErrorException('Deposit failed');
    }
  }
  private async resendDepositRequest(depositId: string) {
    try {
      const response = await fetch(
        `${this.PAWAPAY_URL}/deposits/resend-callback/${depositId}`,
        {
          headers: {
            Authorization: `Bearer ${this.API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = (await response.json()) as ResendDepositResponseDto;
      return data;
    } catch (error) {
      console.warn('Error while resending deposit request', error);
      throw new InternalServerErrorException(
        'Failed to resend deposit request',
      );
    }
  }
  private predictProvider(phoneNumber: string): PaymentProvider {
    return phoneNumber.substring(0, 5).endsWith('06')
      ? PaymentProvider.MTN
      : PaymentProvider.AIRTEL;
  }

  async processTicketPayment(
    ticketId: string,
    userId: string,
    amount: string,
    phoneNumber: string,
  ) {
   await this.initiatePaymentDepositQueue.add('initiate-payment-deposit', {
      userId,
      entityId: ticketId,
      entityName: 'ticketId',
      amount,
      phoneNumber,
      customerMessage: this.ticketPaymentMessage,
    });
  }

  async resendTicketPaymentCallback(eventUserId: string) {
    const resendResponse = await this.resendDepositRequest(eventUserId);
    return resendResponse;
  }

  async checkDepositStatus(depositId: string) {
    try {
      const response = await fetch(
        `${this.PAWAPAY_URL}/deposits/${depositId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        },
      );
      const data = (await response.json()) as CheckDepositStatusResponseDto;
      console.log(data);
      return data;
    } catch (error) {
      console.warn('Error while checking deposit status', error);
      throw new InternalServerErrorException('Failed to check deposit status');
    }
  }
}
