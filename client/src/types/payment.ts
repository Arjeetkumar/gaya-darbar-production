export type PaymentStatus =
  | 'pending'
  | 'paid'
  | 'failed'
  | 'partially_refunded'
  | 'refunded';

export interface RefundRecord {
  refundId: string;
  amount: number;
  reason: string;
  status: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  _id: string;
  order: any;
  user: any;
  orderNumber: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId?: string | null;
  amount: number;
  amountInPaise: number;
  currency: string;
  status: PaymentStatus;
  method?: string | null;
  failureReason?: string | null;
  refundId?: string | null;
  refundedAmount: number;
  refundsList: RefundRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePaymentOrderResponse {
  keyId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  orderId: string;
  orderNumber: string;
}

export interface AdminPaymentsListResponse {
  payments: PaymentRecord[];
  total: number;
  page: number;
  pages: number;
}
