/**
 * Public AI Knowledge Source — injected into AI assistant system prompt
 *
 * HOW TO UPDATE:
 * 1. Edit the content below
 * 2. Commit + push → Railway auto-deploys
 * 3. AI assistant picks up new knowledge on next server start
 *
 * No background sync. Knowledge updates only by code deploy.
 */

import { SERVICE_AREAS, getActiveCities, getComingSoonCities } from "../../shared/service_areas";

/** Build date stamp — set at deploy time */
export const KNOWLEDGE_VERSION = `deploy-${new Date().toISOString().slice(0, 10)}`;

/** Generate dynamic service area knowledge from the static data source */
function buildServiceAreaKnowledge(): string {
  const active = getActiveCities();
  const coming = getComingSoonCities();

  const activeList = active.map(c => {
    const distAr = c.districts.map(d => d.ar).join("، ");
    const distEn = c.districts.map(d => d.en).join(", ");
    return `### ${c.name_ar} (${c.name_en}) — نشطة / Active
الأحياء المتاحة (${c.districts.length}):
- بالعربي: ${distAr}
- English: ${distEn}`;
  }).join("\n\n");

  const comingList = coming.map(c =>
    `- ${c.name_ar} (${c.name_en}): ${c.districts.length} حي جاهز للإطلاق`
  ).join("\n");

  return `## مناطق الخدمة / Service Areas

${activeList}

### مدن قادمة قريباً / Coming Soon Cities
${comingList}

**ملاحظة مهمة**: إذا سأل المستخدم عن مدينة غير الرياض، أجب:
- بالعربي: "حالياً نخدم الرياض فقط — قريباً جدة والمدينة المنورة."
- English: "Currently we serve Riyadh only. Jeddah and Madinah are coming soon."`;
}

/** Static FAQ knowledge */
const FAQ_KNOWLEDGE = `## أسئلة شائعة / FAQ

### ما هو المفتاح الشهري؟ / What is Monthly Key?
منصة سعودية متخصصة في الإيجار الشهري للشقق والعقارات المفروشة. نربط المستأجرين بالملاك مباشرة مع ضمان جودة العقارات.
A Saudi platform specializing in monthly furnished apartment and property rentals. We connect tenants with landlords directly while ensuring property quality.

### كم رسوم الخدمة؟ / What are the service fees?
- رسوم الخدمة: 5% من قيمة الإيجار الشهري
- ضريبة القيمة المضافة: 15% (VAT)
- التأمين: قابل للاسترداد عند المغادرة بعد الفحص
- Service fee: 5% of monthly rent
- VAT: 15%
- Security deposit: Refundable upon checkout after inspection

### ما أنواع العقارات المتاحة؟ / What property types are available?
شقة، فيلا، استوديو، دوبلكس، غرفة مفروشة، كمباوند، شقة فندقية
Apartment, Villa, Studio, Duplex, Furnished Room, Compound, Hotel Apartment

### كيف أحجز عقار؟ / How to book a property?
1. ابحث عن عقار يناسبك في صفحة البحث
2. اضغط "احجز الآن" في صفحة العقار
3. اختر تاريخ الدخول والمدة
4. راجع التكلفة (إيجار + تأمين + رسوم خدمة 5%)
5. أكد الحجز وانتظر موافقة المالك

### كيف أرسل طلب صيانة؟ / How to submit maintenance?
من لوحة التحكم → تبويب الصيانة → طلب جديد → اختر العقار والفئة والأولوية → أرفق صور

### ما سياسة الإلغاء؟ / Cancellation policy?
- قبل موافقة المالك: إلغاء مجاني
- بعد الموافقة: يخضع لشروط العقد
- التأمين: يُسترد بعد فحص المغادرة
- رسوم الخدمة: غير قابلة للاسترداد

### هل يمكنني التواصل مع المالك مباشرة؟ / Can I contact the landlord?
نعم، من صفحة العقار أو من قسم الرسائل في لوحة التحكم.

### كيف أضيف عقاري كمالك؟ / How to list my property?
1. سجل دخول كمالك عقار
2. اضغط "أضف عقارك" من القائمة
3. املأ البيانات بالعربي والإنجليزي
4. ارفع صور عالية الجودة
5. حدد السعر والمرافق والقواعد
6. أرسل للمراجعة — بعد الموافقة يظهر عقارك`;

/** Important internal links */
const LINKS_KNOWLEDGE = `## روابط مهمة / Important Links
- الصفحة الرئيسية / Home: /
- البحث / Search: /search
- تسجيل الدخول / Login: /login
- التسجيل / Register: /register
- لوحة المستأجر / Tenant Dashboard: /tenant
- لوحة المالك / Landlord Dashboard: /landlord
- طلب صيانة / Maintenance: من لوحة التحكم
- الرسائل / Messages: /messages
- الأسئلة الشائعة / FAQ: /faq
- سياسة الخصوصية / Privacy: /privacy
- الشروط والأحكام / Terms: /terms
- تواصل معنا / Contact: /contact`;

/** Platform facts */
const PLATFORM_FACTS = `## حقائق عن المنصة / Platform Facts
- المنصة سعودية 100% ومتوافقة مع أنظمة المملكة
- تدعم اللغتين العربية والإنجليزية بالكامل
- تدعم الوضع الليلي والنهاري
- متوافقة مع الجوال (Mobile-first)
- العملة: ريال سعودي (SAR)
- الأدوار: مستأجر (Tenant)، مالك (Landlord)، مدير (Admin)
- طرق الدفع: تحويل بنكي، بطاقة ائتمان (قريباً)
- التحقق: رقم الجوال + OTP`;

/**
 * Build the complete public knowledge context for AI injection
 */
export function buildPublicKnowledge(): string {
  return [
    `## [Knowledge Version: ${KNOWLEDGE_VERSION}]`,
    buildServiceAreaKnowledge(),
    FAQ_KNOWLEDGE,
    LINKS_KNOWLEDGE,
    PLATFORM_FACTS,
  ].join("\n\n");
}
