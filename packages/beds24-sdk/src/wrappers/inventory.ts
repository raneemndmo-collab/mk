import { Beds24Client } from "../auth/client.js";

export interface InventoryDay {
  date: string;
  available: number;
  price: number;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
  [key: string]: unknown;
}

export interface InventoryWriteDay {
  date: string;
  available?: number;
  price?: number;
  minStay?: number;
  maxStay?: number;
  closedToArrival?: boolean;
  closedToDeparture?: boolean;
}

export class InventoryWrapper {
  constructor(private client: Beds24Client) {}

  /** Read inventory calendar for a room. */
  async getCalendar(
    roomId: number,
    startDate: string,
    endDate: string
  ): Promise<InventoryDay[]> {
    const { data } = await this.client.get<InventoryDay[]>("/api/v2/inventory/rooms/calendar", {
      roomId: String(roomId),
      startDate,
      endDate,
    });
    return Array.isArray(data) ? data : [];
  }

  /** Write inventory calendar for a room. */
  async setCalendar(
    roomId: number,
    days: InventoryWriteDay[]
  ): Promise<{ success: boolean }> {
    const { data } = await this.client.post<{ success: boolean }>(
      "/api/v2/inventory/rooms/calendar",
      { roomId, days }
    );
    return data;
  }

  /** Check availability for a date range. */
  async checkAvailability(
    roomId: number,
    checkIn: string,
    checkOut: string
  ): Promise<boolean> {
    const calendar = await this.getCalendar(roomId, checkIn, checkOut);
    return calendar.every((day) => day.available > 0);
  }
}
