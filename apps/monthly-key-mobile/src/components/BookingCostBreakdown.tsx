import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';
import { formatPrice } from '@/lib/utils/pricing';
import type { BookingBreakdown } from '@/lib/types';

interface BookingCostBreakdownProps {
  breakdown: BookingBreakdown;
}

export function BookingCostBreakdown({ breakdown }: BookingCostBreakdownProps) {
  const { colors } = useTheme();
  const { t, locale, isRTL } = useI18n();

  const rows = [
    { label: t('booking.baseRent'), value: breakdown.baseRent, testID: 'base-rent-amount' },
    { label: t('booking.serviceFee'), value: breakdown.serviceFee, testID: 'service-fee-amount' },
    { label: t('booking.vat'), value: breakdown.vat, testID: 'vat-amount' },
    { label: t('booking.deposit'), value: breakdown.deposit, testID: 'deposit-amount' },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
      testID="cost-breakdown"
    >
      <Text style={[styles.title, { color: colors.foreground }]}>
        {t('booking.costBreakdown')}
      </Text>

      {rows.map((row) => (
        <View
          key={row.testID}
          style={[
            styles.row,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <Text style={[styles.label, { color: colors.foreground + 'CC' }]}>
            {row.label}
          </Text>
          <Text
            style={[styles.value, { color: colors.foreground }]}
            testID={row.testID}
          >
            {formatPrice(row.value, locale)}
          </Text>
        </View>
      ))}

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <View
        style={[
          styles.row,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        <Text style={[styles.totalLabel, { color: colors.primary }]}>
          {t('booking.total')}
        </Text>
        <Text
          style={[styles.totalValue, { color: colors.primary }]}
          testID="total-amount"
        >
          {formatPrice(breakdown.total, locale)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  row: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
  },
});
