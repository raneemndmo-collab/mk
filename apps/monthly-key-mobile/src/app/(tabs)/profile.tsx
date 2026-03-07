import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  I18nManager,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const { t, locale, isRTL, setLocale } = useI18n();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace('/auth/login');
  }, [logout, router]);

  const handleToggleLanguage = useCallback(() => {
    setLocale(locale === 'ar' ? 'en' : 'ar');
  }, [locale, setLocale]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {user && (
        <View style={[styles.profileHeader, { backgroundColor: colors.card }]}>
          <View
            style={[styles.avatar, { backgroundColor: colors.primary + '30' }]}
          >
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user.nameAr.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user.nameAr}
          </Text>
          <Text style={[styles.email, { color: colors.foreground + '99' }]}>
            {user.email}
          </Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          {t('profile.settings')}
        </Text>

        <TouchableOpacity
          style={[
            styles.settingRow,
            {
              backgroundColor: colors.card,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
          onPress={handleToggleLanguage}
          testID="language-toggle"
        >
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>
            {t('profile.language')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.primary }]}>
            {locale === 'ar' ? 'العربية' : 'English'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.settingRow,
            {
              backgroundColor: colors.card,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
          onPress={toggleTheme}
          testID="theme-toggle"
        >
          <Text style={[styles.settingLabel, { color: colors.foreground }]}>
            {t('profile.theme')}
          </Text>
          <Text style={[styles.settingValue, { color: colors.primary }]}>
            {isDark ? '🌙' : '☀️'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        testID="logout-button"
        style={[styles.logoutButton, { borderColor: '#EF4444' }]}
        onPress={handleLogout}
        activeOpacity={0.8}
      >
        <Text style={styles.logoutText}>{t('auth.logout')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 16,
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
  settingRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  logoutButton: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 24,
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
});
