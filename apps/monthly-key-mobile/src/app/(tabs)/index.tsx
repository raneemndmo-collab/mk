import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { PropertyList } from '@/components/PropertyList';
import { OfflineBanner } from '@/components/OfflineBanner';
import { trpc } from '@/lib/api/client';
import type { Property, PropertySearchResult } from '@/lib/types';

export default function HomeScreen() {
  const { user, isAuthenticated } = useAuth();
  const { colors } = useTheme();
  const { t, isRTL } = useI18n();
  const router = useRouter();

  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProperties = useCallback(async () => {
    try {
      const result = (await trpc.property.search.query()) as PropertySearchResult;
      setProperties(result.items);
    } catch {
      // Use empty array on error
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProperties();
  }, [fetchProperties]);

  const handlePropertyPress = useCallback(
    (id: number) => {
      router.push(`/property/${id}`);
    },
    [router]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <OfflineBanner />

      <View style={styles.header}>
        {user && (
          <Text
            style={[
              styles.greeting,
              {
                color: colors.foreground,
                textAlign: isRTL ? 'right' : 'left',
              },
            ]}
          >
            {user.nameAr}
          </Text>
        )}
        <Text
          style={[
            styles.appName,
            {
              color: colors.primary,
              textAlign: isRTL ? 'right' : 'left',
            },
          ]}
        >
          {t('app.name')}
        </Text>
      </View>

      <PropertyList
        properties={properties}
        onPropertyPress={handlePropertyPress}
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '500',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  appName: {
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
