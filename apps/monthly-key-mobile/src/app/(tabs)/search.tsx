import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { PropertyList } from '@/components/PropertyList';
import { trpc } from '@/lib/api/client';
import { STATIC_CITIES } from '@/lib/utils/static-cities';
import type { Property, PropertySearchResult, City } from '@/lib/types';

export default function SearchScreen() {
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string | undefined>();

  const fetchCities = useCallback(async () => {
    try {
      const result = (await trpc.geo.all.query()) as City[];
      setCities(result);
    } catch {
      // Fallback to static cities when API returns 404
      setCities(STATIC_CITIES);
    }
  }, []);

  const fetchProperties = useCallback(
    async (pageNum: number, append = false) => {
      try {
        setIsLoading(true);
        const result = (await trpc.property.search.query({
          page: pageNum,
          city: selectedCity,
        })) as PropertySearchResult;

        if (append) {
          setProperties((prev) => [...prev, ...result.items]);
        } else {
          setProperties(result.items);
        }
        setHasMore(result.hasMore);
        setPage(result.currentPage);
      } catch {
        // Handle error
      } finally {
        setIsLoading(false);
      }
    },
    [selectedCity]
  );

  useEffect(() => {
    fetchCities();
    fetchProperties(1);
  }, [fetchCities, fetchProperties]);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoading) {
      fetchProperties(page + 1, true);
    }
  }, [hasMore, isLoading, page, fetchProperties]);

  const handlePropertyPress = useCallback(
    (id: number) => {
      router.push(`/property/${id}`);
    },
    [router]
  );

  const handleFilterPress = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const handleCitySelect = useCallback(
    (city: string) => {
      setSelectedCity(city);
      setShowFilters(false);
      fetchProperties(1);
    },
    [fetchProperties]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>
          {t('nav.search')}
        </Text>
        <TouchableOpacity
          testID="filter-button"
          onPress={handleFilterPress}
          style={[styles.filterButton, { backgroundColor: colors.card }]}
        >
          <Text style={[styles.filterText, { color: colors.primary }]}>
            {t('search.filter')}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View
          style={[styles.filterPanel, { backgroundColor: colors.card }]}
          testID="filter-panel"
        >
          <Text style={[styles.filterTitle, { color: colors.foreground }]}>
            {t('search.city')}
          </Text>
          {cities.map((city) => (
            <TouchableOpacity
              key={city.id}
              testID="city-option"
              onPress={() => handleCitySelect(city.nameAr)}
              style={[
                styles.cityOption,
                selectedCity === city.nameAr && {
                  backgroundColor: colors.primary + '20',
                },
              ]}
            >
              <Text style={[styles.cityText, { color: colors.foreground }]}>
                {city.nameAr}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <PropertyList
        properties={properties}
        onPropertyPress={handlePropertyPress}
        onEndReached={handleEndReached}
        isLoading={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterPanel: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  cityOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  cityText: {
    fontSize: 14,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
