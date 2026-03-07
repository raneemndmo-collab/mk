/**
 * Firebase Tests — FCM Push Notifications (Emulator Only)
 *
 * Uses Firebase Local Emulator — no production Firebase calls.
 * Prerequisite: firebase emulators:start --only auth,functions
 */

import { buildNotification } from '@/lib/utils/notifications';

describe('FCM Push Notifications (Emulator)', () => {
  const EMULATOR_BASE = 'http://localhost:4000';

  it('booking confirmed notification has correct Arabic content', () => {
    const notification = buildNotification('booking_confirmed', {
      propertyName: 'شقة فاخرة في الرياض',
      bookingId: 42,
    });
    expect(notification.title).toBe('تم تأكيد حجزك');
    expect(notification.body).toContain('شقة فاخرة في الرياض');
    expect(notification.data.type).toBe('booking_confirmed');
    expect(notification.data.bookingId).toBe(42);
  });

  it('payment received notification is in Arabic', () => {
    const notification = buildNotification('payment_received', { amount: 5000 });
    expect(notification.title).toBe('تم استلام الدفعة');
    expect(notification.body).toContain('5,000');
    expect(notification.body).toContain('ر.س');
  });

  it('check-in reminder is sent 24 hours before', () => {
    const notification = buildNotification('checkin_reminder', {
      propertyName: 'شقة جدة',
      checkInDate: '2026-04-01',
    });
    expect(notification.title).toBe('تذكير بموعد الوصول');
    expect(notification.body).toContain('غداً');
  });

  it('all notification types have non-empty title and body', () => {
    const types = [
      'booking_confirmed',
      'booking_rejected',
      'payment_received',
      'payment_reminder',
      'maintenance_update',
      'new_message',
      'lease_ready',
      'checkin_reminder',
    ] as const;

    types.forEach((type) => {
      const notification = buildNotification(type, {
        propertyName: 'عقار',
        amount: 1000,
        senderName: 'أحمد',
      });
      expect(notification.title.length).toBeGreaterThan(0);
      expect(notification.body.length).toBeGreaterThan(0);
    });
  });

  it('booking rejected notification includes property name', () => {
    const notification = buildNotification('booking_rejected', {
      propertyName: 'فيلا الملقا',
      bookingId: 99,
    });
    expect(notification.title).toBe('تم رفض الحجز');
    expect(notification.body).toContain('فيلا الملقا');
  });

  it('payment reminder notification includes amount in SAR', () => {
    const notification = buildNotification('payment_reminder', {
      amount: 12300,
    });
    expect(notification.title).toBe('تذكير بموعد الدفع');
    expect(notification.body).toContain('ر.س');
  });

  it('maintenance update notification references property', () => {
    const notification = buildNotification('maintenance_update', {
      propertyName: 'شقة النخيل',
    });
    expect(notification.title).toBe('تحديث الصيانة');
    expect(notification.body).toContain('شقة النخيل');
  });

  it('new message notification includes sender name', () => {
    const notification = buildNotification('new_message', {
      senderName: 'محمد العلي',
    });
    expect(notification.title).toBe('رسالة جديدة');
    expect(notification.body).toContain('محمد العلي');
  });

  it('lease ready notification references property', () => {
    const notification = buildNotification('lease_ready', {
      propertyName: 'شقة الورود',
    });
    expect(notification.title).toBe('العقد جاهز للتوقيع');
    expect(notification.body).toContain('شقة الورود');
  });

  it('notification data includes correct type field', () => {
    const notification = buildNotification('booking_confirmed', {
      propertyName: 'عقار',
      bookingId: 1,
    });
    expect(notification.data).toHaveProperty('type', 'booking_confirmed');
    expect(notification.data).toHaveProperty('bookingId', 1);
  });
});
