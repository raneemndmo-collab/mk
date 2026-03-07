import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils/pricing';
import { trpc } from '@/lib/api/client';
import type { Booking } from '@/lib/types';

export default function BookingsScreen() {
  const { isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const result = (await trpc.booking.list.query()) as Booking[];
      setBookings(result);
    } catch {
      // Handle error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const statusColors: Record<string, string> = {
    pending: '#F59E0B',
    confirmed: '#10B981',
    rejected: '#EF4444',
    cancelled: '#6B7280',
  };

  const renderBooking = useCallback(
    ({ item }: { item: Booking }) => (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/property/${item.propertyId}`)}
        testID="booking-card"
      >
        <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.propertyTitle, { color: colors.foreground }]}>
            {item.property?.titleAr || `عقار #${item.propertyId}`}
          </Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: (statusColors[item.status] || '#6B7280') + '20' },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: statusColors[item.status] || '#6B7280' },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        <View style={[styles.cardDetails, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.detailText, { color: colors.foreground + '99' }]}>
            {item.checkIn} → {item.checkOut}
          </Text>
          <Text style={[styles.priceText, { color: colors.primary }]}>
            {formatPrice(item.totalAmount, locale)}
          </Text>
        </View>
      </TouchableOpacity>
    ),
    [colors, isRTL, locale, router]
  );

  if (!isAuthenticated) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.foreground }}>{t('auth.login')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.center}>
            <Text style={{ color: colors.foreground + '99' }}>
              {t('search.noResults')}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    flexGrow: 1,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDetails: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 13,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
