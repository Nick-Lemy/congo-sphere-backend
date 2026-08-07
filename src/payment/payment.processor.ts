import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { PaymentService } from "./payment.service";
import { Job } from "bullmq";


export interface InitiatePaymentDepositJob {
    userId: string,
    entityId: string,
    entityName: string,
    amount: string,
    phoneNumber: string,
    customerMessage: string,
}

@Processor('initiate-payment-deposit', { concurrency: 2 })
export class InitiatePaymentDepositProcessor extends WorkerHost {
    private readonly logger = new Logger(InitiatePaymentDepositProcessor.name);
    constructor(
        private readonly paymentService: PaymentService
    ){
        super();
    }
    async process(job: Job<InitiatePaymentDepositJob>) {
        const { userId, entityId, entityName, amount, phoneNumber, customerMessage } = job.data;
        const depositResponse = await this.paymentService.initiateDeposit(
            userId,
            entityId,
            entityName,
            amount,
            phoneNumber,
            customerMessage
        );
        this.logger.log(`Deposit initiated for user ${userId} with deposit ID ${depositResponse.depositId}.`);
    }
}