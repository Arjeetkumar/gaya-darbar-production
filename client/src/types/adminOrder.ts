import type { Order, OrderStatus, OrderType, PaymentStatus } from './order';

export interface AdminOrderCustomer {
  id?: string;
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface AdminOrder extends Omit<Order, 'user'> {
  user: AdminOrderCustomer | string;
}

export interface AdminOrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminOrderListResponse {
  data: AdminOrder[];
  pagination: AdminOrderPagination;
}

export interface AdminOrderFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus | 'ALL';
  orderType?: OrderType | 'ALL';
  paymentStatus?: PaymentStatus | 'ALL';
  dateFrom?: string;
  dateTo?: string;
  sort?: string;
}
