import { Beds24Client } from "../auth/client.js";

export interface Beds24Booking {
  id: number;
  propertyId: number;
  roomId: number;
  status: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  arrival: string;
  departure: string;
  numAdult?: number;
  numChild?: number;
  price?: number;
  currency?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface Beds24BookingCreate {
  propertyId: number;
  roomId: number;
  arrival: string;
  departure: string;
  guestFirstName: string;
  guestLastName: string;
  guestEmail?: string;
  guestPhone?: string;
  numAdult?: number;
  numChild?: number;
  price?: number;
  currency?: string;
  notes?: string;
  [key: string]: unknown;
}

export interface Beds24BookingUpdate {
  status?: string;
  arrival?: string;
  departure?: string;
  guestFirstName?: string;
  guestLastName?: string;
  guestEmail?: string;
  guestPhone?: string;
  notes?: string;
  [key: string]: unknown;
}

export class BookingsWrapper {
  constructor(private client: Beds24Client) {}

  async getBookings(params?: {
    propertyId?: number;
    roomId?: number;
    arrivalFrom?: string;
    arrivalTo?: string;
    modifiedSince?: string;
  }): Promise<Beds24Booking[]> {
    const query: Record<string, string> = {};
    if (params?.propertyId) query.propertyId = String(params.propertyId);
    if (params?.roomId) query.roomId = String(params.roomId);
    if (params?.arrivalFrom) query.arrivalFrom = params.arrivalFrom;
    if (params?.arrivalTo) query.arrivalTo = params.arrivalTo;
    if (params?.modifiedSince) query.modifiedSince = params.modifiedSince;

    const { data } = await this.client.get<Beds24Booking[]>("/api/v2/bookings", query);
    return Array.isArray(data) ? data : [];
  }

  async getBooking(id: number): Promise<Beds24Booking> {
    const { data } = await this.client.get<Beds24Booking>(`/api/v2/bookings/${id}`);
    return data;
  }

  async createBooking(booking: Beds24BookingCreate): Promise<Beds24Booking> {
    const { data } = await this.client.post<Beds24Booking>("/api/v2/bookings", booking);
    return data;
  }

  async updateBooking(id: number, update: Beds24BookingUpdate): Promise<Beds24Booking> {
    const { data } = await this.client.put<Beds24Booking>(`/api/v2/bookings/${id}`, update);
    return data;
  }

  async cancelBooking(id: number): Promise<Beds24Booking> {
    return this.updateBooking(id, { status: "cancelled" });
  }
}
