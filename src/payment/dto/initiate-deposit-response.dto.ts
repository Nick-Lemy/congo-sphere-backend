import {
  InitiateDepositStatus,
  RejectionReason,
} from '../../common/types/payment.types';

export type InitiateDepositResponseDto =
  | AcceptedDepositResponseDto
  | RejectedDepositResponseDto;

export class AcceptedDepositResponseDto {
  depositId!: string;
  status!: InitiateDepositStatus.ACCEPTED;
  created!: string;
}

export class RejectedDepositResponseDto {
  depositId!: string;
  status!: InitiateDepositStatus.REJECTED;
  rejectionReason!: RejectionReason;
}
