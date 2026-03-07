/**
 * Monthly Key Mobile — Core Type Definitions
 */

// ─── Property Types ─────────────────────────────────────────────────────────

export interface PropertyPhoto {
  url: string;
  isCover: boolean;
}

export interface Property {
  id: number;
  titleAr: string;
  titleEn?: string;
  dailyRate: number;
  monthlyRate: number;
  city: string;
  district: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  status: 'active' | 'inactive' | 'maintenance';
  photos: PropertyPhoto[];
  amenities?: string[];
  latitude?: number;
  longitude?: number;
  description?: string;
  descriptionEn?: string;
}

export interface PropertySearchResult {
  items: Property[];
  total: number;
  hasMore: boolean;
  currentPage: number;
}

export interface PropertySearchFilters {
  city?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  district?: string;
  amenities?: string[];
  sortBy?: 'price_asc' | 'price_desc' | 'newest';
}

// ─── Booking Types ──────────────────────────────────────────────────────────

export interface BookingBreakdown {
  baseRent: number;
  serviceFee: number;
  vat: number;
  deposit: number;
  total: number;
}

export interface BookingCreatePayload {
  propertyId: number;
  checkIn: string;
  checkOut: string;
  durationMonths: number;
  paymentMethod: 'bank_transfer' | 'credit_card' | 'mada';
}

export interface BookingResponse {
  id: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  propertyId: number;
}

export interface Booking {
  id: number;
  propertyId: number;
  property: Property;
  checkIn: string;
  checkOut: string;
  durationMonths: number;
  status: 'pending' | 'confirmed' | 'rejected' | 'cancelled';
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
}

// ─── User / Auth Types ──────────────────────────────────────────────────────

export interface User {
  id: number;
  nameAr: string;
  nameEn?: string;
  email: string;
  phone?: string;
  role: 'tenant' | 'owner' | 'admin';
  avatar?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// ─── Notification Types ─────────────────────────────────────────────────────

export type NotificationType =
  | 'booking_confirmed'
  | 'booking_rejected'
  | 'payment_received'
  | 'payment_reminder'
  | 'maintenance_update'
  | 'new_message'
  | 'lease_ready'
  | 'checkin_reminder';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data: {
    type: NotificationType;
    bookingId?: number;
    propertyId?: number;
    amount?: number;
    senderName?: string;
  };
}

// ─── City / Geo Types ───────────────────────────────────────────────────────

export interface City {
  id: number;
  nameAr: string;
  nameEn: string;
  latitude: number;
  longitude: number;
}

// ─── Theme Types ────────────────────────────────────────────────────────────

export interface ThemeColors {
  primary: string;
  background: string;
  card: string;
  foreground: string;
  border: string;
}

// ─── Pricing Types ──────────────────────────────────────────────────────────

export interface BookingTotalParams {
  monthlyRent: number;
  durationMonths: number;
  serviceFeePercent: number;
  vatPercent: number;
  depositMonths: number;
}

// ─── Payment Types ──────────────────────────────────────────────────────────

export interface Payment {
  id: number;
  bookingId: number;
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  method: string;
  createdAt: string;
}
