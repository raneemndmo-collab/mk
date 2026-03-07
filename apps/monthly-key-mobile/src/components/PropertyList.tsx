import React, { useCallback } from 'react';
import { FlatList, StyleSheet, View, Text } from 'react-native';
import { PropertyCard } from './PropertyCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import type { Property } from '@/lib/types';

interface PropertyListProps {
  properties: Property[];
  onPropertyPress?: (id: number) => void;
  onEndReached?: () => void;
  isLoading?: boolean;
  initialNumToRender?: number;
}

export function PropertyList({
  properties,
  onPropertyPress,
  onEndReached,
  isLoading,
  initialNumToRender = 10,
}: PropertyListProps) {
  const { colors } = useTheme();
  const { t } = useI18n();

  const keyExtractor = useCallback(
    (item: Property) => String(item.id),
    []
  );

  const renderItem = useCallback(
    ({ item }: { item: Property }) => (
      <PropertyCard property={item} onPress={onPropertyPress} />
    ),
    [onPropertyPress]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.foreground + '99' }]}>
          {t('search.noResults')}
        </Text>
      </View>
    ),
    [colors, t]
  );

  return (
    <FlatList
      testID="property-list"
      data={properties}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      initialNumToRender={initialNumToRender}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews
      ListEmptyComponent={renderEmpty}
      contentContainerStyle={[
        styles.list,
        { backgroundColor: colors.background },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
  },
});
