import { Beds24Client } from "../auth/client.js";

export interface Beds24Guest {
  id: number;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  [key: string]: unknown;
}

export interface Beds24Message {
  id: number;
  bookingId: number;
  message: string;
  from?: string;
  date?: string;
  [key: string]: unknown;
}

export class GuestsWrapper {
  constructor(private client: Beds24Client) {}

  async getGuests(params?: { bookingId?: number }): Promise<Beds24Guest[]> {
    const query: Record<string, string> = {};
    if (params?.bookingId) query.bookingId = String(params.bookingId);
    const { data } = await this.client.get<Beds24Guest[]>("/api/v2/guests", query);
    return Array.isArray(data) ? data : [];
  }

  async getMessages(bookingId: number): Promise<Beds24Message[]> {
    const { data } = await this.client.get<Beds24Message[]>("/api/v2/bookings/messages", {
      bookingId: String(bookingId),
    });
    return Array.isArray(data) ? data : [];
  }

  async sendMessage(bookingId: number, message: string): Promise<Beds24Message> {
    const { data } = await this.client.post<Beds24Message>("/api/v2/bookings/messages", {
      bookingId,
      message,
    });
    return data;
  }
}
