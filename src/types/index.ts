import { Role, OrderStatus } from "@prisma/client";

export type { Role, OrderStatus };

export interface User {
  id: string;
  email: string;
  name?: string | null;
  image?: string | null;
  role: Role;
}

export interface Event {
  id: string;
  title: string;
  description?: string | null;
  banner?: string | null;
  location: string;
  dateTime: Date;
  isPublished: boolean;
  organizerId: string;
  organizer?: User;
  ticketTypes?: TicketType[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketType {
  id: string;
  name: string;
  price: number;
  quantity: number;
  soldCount: number;
  salesStart?: Date | null;
  salesEnd?: Date | null;
  eventId: string;
  event?: Event;
  tickets?: Ticket[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Ticket {
  id: string;
  ticketId: string;
  ticketTypeId: string;
  ticketType?: TicketType;
  ownerId?: string | null;
  owner?: User;
  orderId?: string | null;
  order?: Order;
  isUsed: boolean;
  usedAt?: Date | null;
  usedBy?: string | null;
  qrCode?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  buyerId: string;
  buyer?: User;
  eventId: string;
  event?: Event;
  status: OrderStatus;
  amount: number;
  paymentRef?: string | null;
  paidAt?: Date | null;
  tickets?: Ticket[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  ticketTypeId: string;
  ticketType: TicketType;
  quantity: number;
}

export interface CheckoutData {
  eventId: string;
  items: { ticketTypeId: string; quantity: number }[];
  email: string;
  name: string;
}
