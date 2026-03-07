import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineBanner() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) {
    return null;
  }

  return (
    <View style={styles.container} testID="offline-banner">
      <Text style={styles.text}>لا يوجد اتصال بالإنترنت</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
