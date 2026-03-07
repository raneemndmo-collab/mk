/**
 * Static fallback cities for when geo.all API returns 404.
 * Used as fallback in search filters.
 */

import type { City } from '../types';

export const STATIC_CITIES: City[] = [
  { id: 1, nameAr: 'الرياض', nameEn: 'Riyadh', latitude: 24.7136, longitude: 46.6753 },
  { id: 2, nameAr: 'جدة', nameEn: 'Jeddah', latitude: 21.4858, longitude: 39.1925 },
  { id: 3, nameAr: 'مكة المكرمة', nameEn: 'Makkah', latitude: 21.3891, longitude: 39.8579 },
  { id: 4, nameAr: 'المدينة المنورة', nameEn: 'Madinah', latitude: 24.5247, longitude: 39.5692 },
  { id: 5, nameAr: 'الدمام', nameEn: 'Dammam', latitude: 26.4207, longitude: 50.0888 },
  { id: 6, nameAr: 'الخبر', nameEn: 'Khobar', latitude: 26.2172, longitude: 50.1971 },
  { id: 7, nameAr: 'الظهران', nameEn: 'Dhahran', latitude: 26.2361, longitude: 50.0393 },
  { id: 8, nameAr: 'تبوك', nameEn: 'Tabuk', latitude: 28.3838, longitude: 36.5550 },
  { id: 9, nameAr: 'أبها', nameEn: 'Abha', latitude: 18.2164, longitude: 42.5053 },
  { id: 10, nameAr: 'الطائف', nameEn: 'Taif', latitude: 21.2703, longitude: 40.4158 },
  { id: 11, nameAr: 'بريدة', nameEn: 'Buraidah', latitude: 26.3260, longitude: 43.9750 },
  { id: 12, nameAr: 'خميس مشيط', nameEn: 'Khamis Mushait', latitude: 18.3066, longitude: 42.7291 },
];
