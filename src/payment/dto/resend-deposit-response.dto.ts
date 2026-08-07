import { RejectionReason } from '../../common/types/payment.types';

export type ResendDepositResponseDto =
  | AcceptedResendDepositResponseDto
  | RejectedResendDepositResponseDto;

export type AcceptedResendDepositResponseDto = {
  depositId: string;
  status: 'ACCEPTED';
};

export type RejectedResendDepositResponseDto = {
  depositId: string;
  status: 'REJECTED';
  failureReason: RejectionReason;
};
