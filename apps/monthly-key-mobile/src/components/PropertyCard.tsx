import React, { useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils/pricing';
import type { Property } from '@/lib/types';

interface PropertyCardProps {
  property: Property;
  onPress?: (id: number) => void;
}

export function PropertyCard({ property, onPress }: PropertyCardProps) {
  const { colors } = useTheme();
  const { locale, isRTL } = useI18n();

  const handlePress = useCallback(() => {
    onPress?.(property.id);
  }, [onPress, property.id]);

  const coverPhoto = property.photos.find((p) => p.isCover) || property.photos[0];
  const title = property.titleAr;

  return (
    <TouchableOpacity
      testID="property-card"
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {coverPhoto && (
        <Image
          source={{ uri: coverPhoto.url }}
          style={styles.image}
          resizeMode="cover"
          testID="property-image"
        />
      )}

      <View
        style={[
          styles.content,
          { alignItems: isRTL ? 'flex-end' : 'flex-start' },
        ]}
      >
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={2}
          testID="property-title"
        >
          {title}
        </Text>

        <Text
          style={[styles.location, { color: colors.foreground + '99' }]}
          testID="property-location"
        >
          {property.city} - {property.district}
        </Text>

        <View
          style={[
            styles.details,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[styles.detail, { color: colors.foreground + 'CC' }]}>
            {property.bedrooms}
          </Text>
          <Text style={[styles.detailSeparator, { color: colors.border }]}>
            |
          </Text>
          <Text style={[styles.detail, { color: colors.foreground + 'CC' }]}>
            {property.bathrooms}
          </Text>
          <Text style={[styles.detailSeparator, { color: colors.border }]}>
            |
          </Text>
          <Text style={[styles.detail, { color: colors.foreground + 'CC' }]}>
            {property.area} م²
          </Text>
        </View>

        <View
          style={[
            styles.priceBadge,
            {
              backgroundColor: colors.primary + '20',
              alignSelf: isRTL ? 'flex-end' : 'flex-start',
            },
          ]}
        >
          <Text
            style={[styles.price, { color: colors.primary }]}
            testID="property-price"
          >
            {formatPrice(property.monthlyRate, locale)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: {
    width: 120,
    height: 140,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  location: {
    fontSize: 13,
    marginTop: 4,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  details: {
    marginTop: 8,
    alignItems: 'center',
    gap: 6,
  },
  detail: {
    fontSize: 12,
  },
  detailSeparator: {
    fontSize: 12,
  },
  priceBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  price: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
  },
});
