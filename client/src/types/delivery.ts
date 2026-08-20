export type DeliveryStatus =
  | 'unassigned'
  | 'assigned'
  | 'picked_up'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface DeliveryRider {
  id?: string;
  _id: string;
  name: string;
  email: string;
  role: string;
}

export interface DeliveryCustomerSnapshot {
  name: string;
  email: string;
  phone?: string;
}

export interface DeliveryAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  landmark?: string;
}

export interface Delivery {
  id: string;
  _id: string;
  deliveryNumber: string;
  order: any;
  orderNumber: string;
  rider?: DeliveryRider | null;
  status: DeliveryStatus;
  deliveryAddressSnapshot: DeliveryAddressSnapshot;
  customerSnapshot: DeliveryCustomerSnapshot;
  assignedAt?: string | null;
  pickedUpAt?: string | null;
  outForDeliveryAt?: string | null;
  deliveredAt?: string | null;
  estimatedDeliveryTime?: string | null;
  deliveryNotes?: string;
  failureReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AdminDeliveryListResponse {
  data: Delivery[];
  pagination: DeliveryPagination;
}

export interface DeliveryFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: DeliveryStatus | 'ALL';
  rider?: string;
  dateFrom?: string;
  dateTo?: string;
}
