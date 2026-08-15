import type { PaymentStatus, PaymentMethod } from "./common.types";

export interface MemberPaymentItem {
  id: number;
  amountCents: number;
  method: PaymentStatus | string;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
  planName: string | null;
}

export interface AdminPaymentItem {
  id: number;
  amountCents: number;
  method: PaymentMethod | string;
  status: PaymentStatus;
  reference: string | null;
  createdAt: string;
  memberName: string;
  memberEmail: string;
}
