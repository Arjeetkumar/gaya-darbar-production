import type {
  CreatePaymentOrderResponse,
  PaymentRecord,
  AdminPaymentsListResponse,
} from '../types/payment';
import { getStoredToken } from './authService';
import { buildApiUrl } from './apiConfig';

function getAuthHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  const token = getStoredToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function createRazorpayPaymentOrder(
  orderId: string
): Promise<CreatePaymentOrderResponse> {
  const response = await fetch(buildApiUrl('/api/v1/payments/create-order'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ orderId }),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to initialize payment order.');
  }

  return json.data;
}

export async function verifyPaymentSignature(payload: {
  orderId: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  razorpay_order_id?: string;
}): Promise<PaymentRecord> {
  const response = await fetch(buildApiUrl('/api/v1/payments/verify'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Payment signature verification failed.');
  }

  return {
    ...json.data,
    id: json.data._id || json.data.id,
  };
}

export async function getAdminPayments(params?: {
  status?: string;
  orderNumber?: string;
  limit?: number;
  page?: number;
}): Promise<AdminPaymentsListResponse> {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.orderNumber) query.append('orderNumber', params.orderNumber);
  if (params?.limit) query.append('limit', String(params.limit));
  if (params?.page) query.append('page', String(params.page));

  const response = await fetch(buildApiUrl(`/api/v1/admin/payments?${query.toString()}`), {
    headers: getAuthHeaders(),
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to retrieve admin payments.');
  }

  return json.data;
}

export async function processAdminRefund(
  paymentId: string,
  amount: number,
  reason: string
): Promise<PaymentRecord> {
  const response = await fetch(
    buildApiUrl(`/api/v1/admin/payments/${encodeURIComponent(paymentId)}/refund`),
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ amount, reason }),
    }
  );

  const json = await response.json();

  if (!response.ok || !json.success) {
    throw new Error(json.error?.message || 'Failed to process refund.');
  }

  return {
    ...json.data,
    id: json.data._id || json.data.id,
  };
}
