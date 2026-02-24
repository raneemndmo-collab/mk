import { Beds24Client } from "../auth/client.js";

export interface Beds24Property {
  id: number;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  currency?: string;
  timezone?: string;
  [key: string]: unknown;
}

export interface Beds24Room {
  id: number;
  propertyId: number;
  name: string;
  maxGuests?: number;
  quantity?: number;
  [key: string]: unknown;
}

export class PropertiesWrapper {
  constructor(private client: Beds24Client) {}

  async getProperties(): Promise<Beds24Property[]> {
    const { data } = await this.client.get<Beds24Property[]>("/api/v2/properties");
    return Array.isArray(data) ? data : [];
  }

  async getProperty(id: number): Promise<Beds24Property> {
    const { data } = await this.client.get<Beds24Property>(`/api/v2/properties/${id}`);
    return data;
  }

  async getRooms(propertyId: number): Promise<Beds24Room[]> {
    const { data } = await this.client.get<Beds24Room[]>("/api/v2/rooms", {
      propertyId: String(propertyId),
    });
    return Array.isArray(data) ? data : [];
  }

  async getRoom(roomId: number): Promise<Beds24Room> {
    const { data } = await this.client.get<Beds24Room>(`/api/v2/rooms/${roomId}`);
    return data;
  }
}
