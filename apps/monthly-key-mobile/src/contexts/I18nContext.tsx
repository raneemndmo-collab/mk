import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { I18nManager } from 'react-native';

// ─── Translation dictionaries ───────────────────────────────────────────────

const translations: Record<string, Record<string, string>> = {
  ar: {
    'app.name': 'المفتاح الشهري',
    'nav.home': 'الرئيسية',
    'nav.search': 'البحث',
    'nav.bookings': 'حجوزاتي',
    'nav.profile': 'حسابي',
    'auth.login': 'تسجيل الدخول',
    'auth.logout': 'تسجيل الخروج',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'property.bedrooms': 'غرف النوم',
    'property.bathrooms': 'دورات المياه',
    'property.area': 'المساحة',
    'property.monthlyRent': 'الإيجار الشهري',
    'property.dailyRate': 'السعر اليومي',
    'booking.checkout': 'إتمام الحجز',
    'booking.costBreakdown': 'تفاصيل التكلفة',
    'booking.baseRent': 'الإيجار الأساسي',
    'booking.serviceFee': 'رسوم الخدمة',
    'booking.vat': 'ضريبة القيمة المضافة',
    'booking.deposit': 'مبلغ التأمين',
    'booking.total': 'المجموع',
    'booking.confirm': 'تأكيد الحجز',
    'booking.created': 'تم إنشاء الحجز',
    'booking.paymentMethod': 'طريقة الدفع',
    'booking.bankTransfer': 'تحويل بنكي',
    'booking.creditCard': 'بطاقة ائتمان',
    'booking.mada': 'مدى',
    'search.filter': 'تصفية',
    'search.city': 'المدينة',
    'search.noResults': 'لا توجد نتائج',
    'offline.message': 'لا يوجد اتصال بالإنترنت',
    'error.generic': 'حدث خطأ. يرجى المحاولة مرة أخرى.',
    'profile.settings': 'الإعدادات',
    'profile.language': 'اللغة',
    'profile.theme': 'المظهر',
  },
  en: {
    'app.name': 'Monthly Key',
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.bookings': 'My Bookings',
    'nav.profile': 'Profile',
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'property.bedrooms': 'Bedrooms',
    'property.bathrooms': 'Bathrooms',
    'property.area': 'Area',
    'property.monthlyRent': 'Monthly Rent',
    'property.dailyRate': 'Daily Rate',
    'booking.checkout': 'Checkout',
    'booking.costBreakdown': 'Cost Breakdown',
    'booking.baseRent': 'Base Rent',
    'booking.serviceFee': 'Service Fee',
    'booking.vat': 'VAT',
    'booking.deposit': 'Deposit',
    'booking.total': 'Total',
    'booking.confirm': 'Confirm Booking',
    'booking.created': 'Booking Created',
    'booking.paymentMethod': 'Payment Method',
    'booking.bankTransfer': 'Bank Transfer',
    'booking.creditCard': 'Credit Card',
    'booking.mada': 'Mada',
    'search.filter': 'Filter',
    'search.city': 'City',
    'search.noResults': 'No results found',
    'offline.message': 'No internet connection',
    'error.generic': 'An error occurred. Please try again.',
    'profile.settings': 'Settings',
    'profile.language': 'Language',
    'profile.theme': 'Theme',
  },
};

// ─── Context ────────────────────────────────────────────────────────────────

interface I18nContextValue {
  t: (key: string) => string;
  locale: 'ar' | 'en';
  isRTL: boolean;
  setLocale: (locale: 'ar' | 'en') => void;
}

const I18nContext = createContext<I18nContextValue>({
  t: (key: string) => key,
  locale: 'ar',
  isRTL: true,
  setLocale: () => {},
});

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

interface I18nProviderProps {
  children: React.ReactNode;
  initialLocale?: 'ar' | 'en';
}

export function I18nProvider({ children, initialLocale = 'ar' }: I18nProviderProps) {
  const [locale, setLocaleState] = useState<'ar' | 'en'>(initialLocale);

  const setLocale = useCallback((newLocale: 'ar' | 'en') => {
    setLocaleState(newLocale);
    const isRTL = newLocale === 'ar';
    I18nManager.forceRTL(isRTL);
    I18nManager.allowRTL(isRTL);
  }, []);

  const t = useCallback(
    (key: string): string => {
      return translations[locale]?.[key] || key;
    },
    [locale]
  );

  const isRTL = locale === 'ar';

  const value = useMemo(
    () => ({ t, locale, isRTL, setLocale }),
    [t, locale, isRTL, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
