/**
 * Monthly Key Mobile — Notification Builder
 *
 * Builds push notification payloads with Arabic content.
 * All notification types have non-empty title and body.
 */

import type { NotificationType, PushNotificationPayload } from '../types';

interface NotificationParams {
  propertyName?: string;
  bookingId?: number;
  amount?: number;
  senderName?: string;
  checkInDate?: string;
  propertyId?: number;
}

/**
 * Build a push notification payload for the given type.
 *
 * @param type - The notification type
 * @param params - Parameters for building the notification
 * @returns Complete push notification payload
 */
export function buildNotification(
  type: NotificationType,
  params: NotificationParams
): PushNotificationPayload {
  const { propertyName, bookingId, amount, senderName, checkInDate, propertyId } = params;

  const formatAmount = (value: number): string => {
    return new Intl.NumberFormat('ar-SA').format(value);
  };

  const templates: Record<NotificationType, { title: string; body: string }> = {
    booking_confirmed: {
      title: 'تم تأكيد حجزك',
      body: `تم تأكيد حجزك في ${propertyName || 'العقار'}`,
    },
    booking_rejected: {
      title: 'تم رفض الحجز',
      body: `للأسف تم رفض حجزك في ${propertyName || 'العقار'}. يرجى التواصل مع الدعم.`,
    },
    payment_received: {
      title: 'تم استلام الدفعة',
      body: `تم استلام دفعة بمبلغ ${amount ? formatAmount(amount) : '0'} ر.س بنجاح`,
    },
    payment_reminder: {
      title: 'تذكير بموعد الدفع',
      body: `يرجى سداد المبلغ المستحق ${amount ? formatAmount(amount) : ''} ر.س في أقرب وقت`,
    },
    maintenance_update: {
      title: 'تحديث الصيانة',
      body: `تم تحديث حالة طلب الصيانة الخاص بك في ${propertyName || 'العقار'}`,
    },
    new_message: {
      title: 'رسالة جديدة',
      body: `لديك رسالة جديدة من ${senderName || 'المستخدم'}`,
    },
    lease_ready: {
      title: 'العقد جاهز للتوقيع',
      body: `عقد الإيجار الخاص بك في ${propertyName || 'العقار'} جاهز للتوقيع`,
    },
    checkin_reminder: {
      title: 'تذكير بموعد الوصول',
      body: `موعد وصولك إلى ${propertyName || 'العقار'} غداً ${checkInDate || ''}`,
    },
  };

  const template = templates[type];

  return {
    title: template.title,
    body: template.body,
    data: {
      type,
      ...(bookingId !== undefined && { bookingId }),
      ...(propertyId !== undefined && { propertyId }),
      ...(amount !== undefined && { amount }),
      ...(senderName !== undefined && { senderName }),
    },
  };
}
