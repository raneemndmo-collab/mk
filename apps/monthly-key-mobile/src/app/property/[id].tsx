import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils/pricing';
import { trpc } from '@/lib/api/client';
import type { Property } from '@/lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function PropertyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();
  const router = useRouter();

  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProperty() {
      try {
        const result = (await trpc.property.getById.query({
          id: Number(id),
        })) as Property;
        setProperty(result);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    }
    fetchProperty();
  }, [id]);

  const handleBooking = useCallback(() => {
    router.push(`/booking/${id}`);
  }, [router, id]);

  if (isLoading || !property) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const coverPhoto = property.photos.find((p) => p.isCover) || property.photos[0];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView>
        {coverPhoto && (
          <Image
            source={{ uri: coverPhoto.url }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.content}>
          <Text
            style={[
              styles.title,
              {
                color: colors.foreground,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {property.titleAr}
          </Text>

          <Text
            style={[
              styles.location,
              {
                color: colors.foreground + '99',
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {property.city} - {property.district}
          </Text>

          <View
            style={[
              styles.priceRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View
              style={[
                styles.priceBadge,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.priceText, { color: colors.primary }]}>
                {formatPrice(property.monthlyRate, locale)}
              </Text>
              <Text style={[styles.priceLabel, { color: colors.primary + 'CC' }]}>
                / {t('property.monthlyRent')}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.detailsGrid,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <View style={[styles.detailItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {property.bedrooms}
              </Text>
              <Text style={[styles.detailLabel, { color: colors.foreground + '99' }]}>
                {t('property.bedrooms')}
              </Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {property.bathrooms}
              </Text>
              <Text style={[styles.detailLabel, { color: colors.foreground + '99' }]}>
                {t('property.bathrooms')}
              </Text>
            </View>
            <View style={[styles.detailItem, { backgroundColor: colors.card }]}>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>
                {property.area} م²
              </Text>
              <Text style={[styles.detailLabel, { color: colors.foreground + '99' }]}>
                {t('property.area')}
              </Text>
            </View>
          </View>

          {property.amenities && property.amenities.length > 0 && (
            <View style={styles.amenitiesSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                المرافق
              </Text>
              <View style={[styles.amenitiesRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                {property.amenities.map((amenity) => (
                  <View
                    key={amenity}
                    style={[
                      styles.amenityBadge,
                      { backgroundColor: colors.card },
                    ]}
                  >
                    <Text style={{ color: colors.foreground }}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {property.latitude && property.longitude && (
            <View style={styles.mapContainer}>
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: property.latitude,
                  longitude: property.longitude,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: property.latitude,
                    longitude: property.longitude,
                  }}
                />
              </MapView>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          testID="book-now-button"
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={handleBooking}
          activeOpacity={0.8}
        >
          <Text style={styles.bookButtonText}>{t('booking.checkout')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImage: {
    width: SCREEN_WIDTH,
    height: 280,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  location: {
    fontSize: 14,
    marginTop: 4,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  priceRow: {
    marginTop: 16,
    alignItems: 'center',
  },
  priceBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  priceText: {
    fontSize: 22,
    fontWeight: '800',
  },
  priceLabel: {
    fontSize: 13,
  },
  detailsGrid: {
    marginTop: 20,
    gap: 8,
  },
  detailItem: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  detailValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  amenitiesSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  amenitiesRow: {
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  mapContainer: {
    marginTop: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: 200,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  bookButton: {
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
