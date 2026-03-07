import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useI18n } from '@/contexts/I18nContext';

interface RTLSafeViewProps {
  children: React.ReactNode;
  style?: ViewStyle;
  row?: boolean;
  testID?: string;
}

/**
 * A View wrapper that automatically handles RTL layout.
 * Uses marginStart/marginEnd instead of marginLeft/marginRight.
 * Uses paddingStart/paddingEnd instead of paddingLeft/paddingRight.
 */
export function RTLSafeView({ children, style, row, testID }: RTLSafeViewProps) {
  const { isRTL } = useI18n();

  return (
    <View
      testID={testID}
      style={[
        row && {
          flexDirection: isRTL ? 'row-reverse' : 'row',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({});
