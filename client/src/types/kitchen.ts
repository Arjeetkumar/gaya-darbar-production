export type KitchenTicketStatus =
  | 'pending'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled';

export type KitchenTicketPriority = 'normal' | 'high' | 'urgent';

export interface IKitchenCustomOptionSnapshot {
  name: string;
  category: string;
  quantity?: number;
}

export interface IKitchenItemSnapshot {
  itemType: 'STANDARD_ITEM' | 'CUSTOM_MEAL';
  name: string;
  quantity: number;
  portionChoice?: string;
  sauceChoice?: string;
  customOptionsSnapshot?: IKitchenCustomOptionSnapshot[];
}

export interface KitchenTicket {
  id: string;
  _id: string;
  order: string;
  orderNumber: string;
  items: IKitchenItemSnapshot[];
  status: KitchenTicketStatus;
  priority: KitchenTicketPriority;
  customerNotes?: string;
  startedAt?: string | null;
  readyAt?: string | null;
  completedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GetKitchenTicketsParams {
  status?: KitchenTicketStatus;
  priority?: KitchenTicketPriority;
  active?: boolean;
}
