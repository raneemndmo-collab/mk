import nodemailer from "nodemailer";
import { ENV } from "./_core/env";

// ─── SMTP Email Helper ──────────────────────────────────────────────
// Credentials are configured via Settings > Secrets in the admin panel.
// Required env vars: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM
// Optional: SMTP_SECURE (default: false, uses STARTTLS on port 587)

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
  }>;
}

interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Check if SMTP is configured. Returns false if credentials are missing.
 * Use this to gracefully skip email sending when SMTP is not yet set up.
 */
export function isSmtpConfigured(): boolean {
  return !!(ENV.smtpHost && ENV.smtpUser && ENV.smtpPass && ENV.smtpFrom);
}

/**
 * Create a nodemailer transporter using configured SMTP credentials.
 * Returns null if SMTP is not configured.
 */
function createTransporter() {
  if (!isSmtpConfigured()) return null;

  return nodemailer.createTransport({
    host: ENV.smtpHost,
    port: ENV.smtpPort,
    secure: ENV.smtpSecure, // true for 465, false for 587 (STARTTLS)
    auth: {
      user: ENV.smtpUser,
      pass: ENV.smtpPass,
    },
    tls: {
      rejectUnauthorized: ENV.isProduction, // strict in production
    },
  });
}

/**
 * Send an email using the configured SMTP server.
 * Gracefully returns { success: false } if SMTP is not configured.
 */
export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const transporter = createTransporter();

  if (!transporter) {
    console.warn("[Email] SMTP not configured. Skipping email to:", options.to);
    return { success: false, error: "SMTP not configured" };
  }

  try {
    const info = await transporter.sendMail({
      from: ENV.smtpFrom,
      to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      replyTo: options.replyTo,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(", ") : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(", ") : options.bcc) : undefined,
      attachments: options.attachments,
    });

    console.log("[Email] Sent successfully:", info.messageId, "to:", options.to);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("[Email] Failed to send:", error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Verify SMTP connection. Use this to test credentials from admin settings.
 */
export async function verifySmtpConnection(): Promise<{ connected: boolean; error?: string }> {
  const transporter = createTransporter();

  if (!transporter) {
    return { connected: false, error: "SMTP not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, SMTP_FROM in Settings > Secrets." };
  }

  try {
    await transporter.verify();
    return { connected: true };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

// ─── Email Templates ────────────────────────────────────────────────

const baseTemplate = (content: string, lang: "ar" | "en" = "ar") => `
<!DOCTYPE html>
<html dir="${lang === "ar" ? "rtl" : "ltr"}" lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; direction: ${lang === "ar" ? "rtl" : "ltr"}; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #0B1E2D 0%, #1a3a52 100%); padding: 24px 32px; text-align: center; }
    .header h1 { color: #3ECFC0; font-size: 24px; margin: 0; font-weight: 700; }
    .header p { color: #C9A96E; font-size: 12px; margin: 4px 0 0; }
    .body { padding: 32px; color: #333; line-height: 1.8; }
    .body h2 { color: #0B1E2D; font-size: 20px; margin: 0 0 16px; }
    .body p { margin: 0 0 12px; font-size: 15px; }
    .info-box { background: #f0fdf9; border: 1px solid #3ECFC0; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .info-label { color: #666; font-weight: 500; }
    .info-value { color: #0B1E2D; font-weight: 600; }
    .btn { display: inline-block; background: #3ECFC0; color: #0B1E2D; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px; margin: 16px 0; }
    .footer { background: #f9f9f9; padding: 20px 32px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
    .amount { font-size: 28px; font-weight: 700; color: #C9A96E; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>المفتاح الشهري</h1>
      <p>منصة الإيجارات الشهرية الذكية</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>المفتاح الشهري — منصة الإيجارات الشهرية الذكية</p>
      <p>هذه الرسالة مُرسلة تلقائياً، يرجى عدم الرد عليها مباشرة.</p>
    </div>
  </div>
</body>
</html>
`;

/**
 * Send booking confirmation email to tenant
 */
export async function sendBookingConfirmation(params: {
  tenantEmail: string;
  tenantName: string;
  propertyTitle: string;
  checkIn: string;
  checkOut: string;
  totalAmount: number;
  bookingId: number;
  lang?: "ar" | "en";
}): Promise<EmailResult> {
  const { tenantEmail, tenantName, propertyTitle, checkIn, checkOut, totalAmount, bookingId, lang = "ar" } = params;

  const content = lang === "ar" ? `
    <h2>تأكيد الحجز #${bookingId}</h2>
    <p>مرحباً ${tenantName}،</p>
    <p>تم تأكيد حجزك بنجاح. إليك تفاصيل الحجز:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">العقار</span><span class="info-value">${propertyTitle}</span></div>
      <div class="info-row"><span class="info-label">تاريخ الدخول</span><span class="info-value">${checkIn}</span></div>
      <div class="info-row"><span class="info-label">تاريخ الخروج</span><span class="info-value">${checkOut}</span></div>
      <div class="info-row"><span class="info-label">المبلغ الإجمالي</span><span class="info-value amount">${totalAmount.toLocaleString()} ر.س</span></div>
    </div>
    <p>شكراً لاختيارك المفتاح الشهري.</p>
  ` : `
    <h2>Booking Confirmation #${bookingId}</h2>
    <p>Hello ${tenantName},</p>
    <p>Your booking has been confirmed. Here are the details:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Property</span><span class="info-value">${propertyTitle}</span></div>
      <div class="info-row"><span class="info-label">Check-in</span><span class="info-value">${checkIn}</span></div>
      <div class="info-row"><span class="info-label">Check-out</span><span class="info-value">${checkOut}</span></div>
      <div class="info-row"><span class="info-label">Total Amount</span><span class="info-value amount">${totalAmount.toLocaleString()} SAR</span></div>
    </div>
    <p>Thank you for choosing المفتاح الشهري.</p>
  `;

  return sendEmail({
    to: tenantEmail,
    subject: lang === "ar" ? `تأكيد الحجز #${bookingId} — المفتاح الشهري` : `Booking Confirmation #${bookingId} — المفتاح الشهري`,
    html: baseTemplate(content, lang),
    text: lang === "ar"
      ? `تأكيد الحجز #${bookingId}\nالعقار: ${propertyTitle}\nالدخول: ${checkIn}\nالخروج: ${checkOut}\nالمبلغ: ${totalAmount} ر.س`
      : `Booking Confirmation #${bookingId}\nProperty: ${propertyTitle}\nCheck-in: ${checkIn}\nCheck-out: ${checkOut}\nAmount: ${totalAmount} SAR`,
  });
}

/**
 * Send payment receipt email
 */
export async function sendPaymentReceipt(params: {
  tenantEmail: string;
  tenantName: string;
  amount: number;
  paymentMethod: string;
  bookingId: number;
  transactionId?: string;
  lang?: "ar" | "en";
}): Promise<EmailResult> {
  const { tenantEmail, tenantName, amount, paymentMethod, bookingId, transactionId, lang = "ar" } = params;

  const content = lang === "ar" ? `
    <h2>إيصال الدفع</h2>
    <p>مرحباً ${tenantName}،</p>
    <p>تم استلام دفعتك بنجاح.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">رقم الحجز</span><span class="info-value">#${bookingId}</span></div>
      <div class="info-row"><span class="info-label">المبلغ المدفوع</span><span class="info-value amount">${amount.toLocaleString()} ر.س</span></div>
      <div class="info-row"><span class="info-label">طريقة الدفع</span><span class="info-value">${paymentMethod}</span></div>
      ${transactionId ? `<div class="info-row"><span class="info-label">رقم العملية</span><span class="info-value">${transactionId}</span></div>` : ""}
    </div>
  ` : `
    <h2>Payment Receipt</h2>
    <p>Hello ${tenantName},</p>
    <p>Your payment has been received successfully.</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Booking</span><span class="info-value">#${bookingId}</span></div>
      <div class="info-row"><span class="info-label">Amount Paid</span><span class="info-value amount">${amount.toLocaleString()} SAR</span></div>
      <div class="info-row"><span class="info-label">Payment Method</span><span class="info-value">${paymentMethod}</span></div>
      ${transactionId ? `<div class="info-row"><span class="info-label">Transaction ID</span><span class="info-value">${transactionId}</span></div>` : ""}
    </div>
  `;

  return sendEmail({
    to: tenantEmail,
    subject: lang === "ar" ? `إيصال دفع — الحجز #${bookingId} — المفتاح الشهري` : `Payment Receipt — Booking #${bookingId} — المفتاح الشهري`,
    html: baseTemplate(content, lang),
  });
}

/**
 * Send maintenance status update email to tenant
 */
export async function sendMaintenanceUpdate(params: {
  tenantEmail: string;
  tenantName: string;
  ticketId: number;
  title: string;
  status: string;
  message: string;
  lang?: "ar" | "en";
}): Promise<EmailResult> {
  const { tenantEmail, tenantName, ticketId, title, status, message, lang = "ar" } = params;

  const statusLabels: Record<string, { ar: string; en: string }> = {
    open: { ar: "مفتوح", en: "Open" },
    assigned: { ar: "تم التعيين", en: "Assigned" },
    in_progress: { ar: "قيد التنفيذ", en: "In Progress" },
    resolved: { ar: "تم الحل", en: "Resolved" },
    closed: { ar: "مغلق", en: "Closed" },
  };

  const statusLabel = lang === "ar" ? statusLabels[status]?.ar || status : statusLabels[status]?.en || status;

  const content = lang === "ar" ? `
    <h2>تحديث طلب الصيانة #${ticketId}</h2>
    <p>مرحباً ${tenantName}،</p>
    <p>تم تحديث حالة طلب الصيانة الخاص بك:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">الطلب</span><span class="info-value">${title}</span></div>
      <div class="info-row"><span class="info-label">الحالة الجديدة</span><span class="info-value">${statusLabel}</span></div>
    </div>
    <p><strong>رسالة التحديث:</strong></p>
    <p>${message}</p>
  ` : `
    <h2>Maintenance Request Update #${ticketId}</h2>
    <p>Hello ${tenantName},</p>
    <p>Your maintenance request has been updated:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Request</span><span class="info-value">${title}</span></div>
      <div class="info-row"><span class="info-label">New Status</span><span class="info-value">${statusLabel}</span></div>
    </div>
    <p><strong>Update Message:</strong></p>
    <p>${message}</p>
  `;

  return sendEmail({
    to: tenantEmail,
    subject: lang === "ar" ? `تحديث صيانة #${ticketId} — المفتاح الشهري` : `Maintenance Update #${ticketId} — المفتاح الشهري`,
    html: baseTemplate(content, lang),
  });
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(params: {
  email: string;
  name: string;
  lang?: "ar" | "en";
}): Promise<EmailResult> {
  const { email, name, lang = "ar" } = params;

  const content = lang === "ar" ? `
    <h2>مرحباً بك في المفتاح الشهري</h2>
    <p>أهلاً ${name}،</p>
    <p>شكراً لتسجيلك في منصة المفتاح الشهري — منصة الإيجارات الشهرية الذكية في المملكة العربية السعودية.</p>
    <p>يمكنك الآن:</p>
    <ul>
      <li>البحث عن شقق مفروشة للإيجار الشهري</li>
      <li>حجز إقامتك بسهولة وأمان</li>
      <li>إدراج عقاراتك للإيجار</li>
      <li>إدارة حجوزاتك ومدفوعاتك</li>
    </ul>
    <p>نتمنى لك تجربة مميزة!</p>
  ` : `
    <h2>Welcome to المفتاح الشهري</h2>
    <p>Hello ${name},</p>
    <p>Thank you for registering on المفتاح الشهري — the smart monthly rental platform in Saudi Arabia.</p>
    <p>You can now:</p>
    <ul>
      <li>Search for furnished apartments for monthly rent</li>
      <li>Book your stay easily and securely</li>
      <li>List your properties for rent</li>
      <li>Manage your bookings and payments</li>
    </ul>
    <p>We wish you a great experience!</p>
  `;

  return sendEmail({
    to: email,
    subject: lang === "ar" ? "مرحباً بك في المفتاح الشهري" : "Welcome to المفتاح الشهري",
    html: baseTemplate(content, lang),
  });
}


/**
 * Send email to admin when a new emergency maintenance request is created
 */
export async function sendNewMaintenanceAlert(params: {
  adminEmail: string;
  tenantName: string;
  ticketId: number;
  title: string;
  urgency: string;
  category: string;
  description: string;
  imageCount?: number;
  lang?: "ar" | "en";
}): Promise<EmailResult> {
  const { adminEmail, tenantName, ticketId, title, urgency, category, description, imageCount = 0, lang = "ar" } = params;
  const urgencyLabels: Record<string, { ar: string; en: string; color: string }> = {
    low: { ar: "منخفض", en: "Low", color: "#22c55e" },
    medium: { ar: "متوسط", en: "Medium", color: "#f59e0b" },
    high: { ar: "عالي", en: "High", color: "#f97316" },
    critical: { ar: "حرج", en: "Critical", color: "#ef4444" },
  };
  const categoryLabels: Record<string, { ar: string; en: string }> = {
    plumbing: { ar: "سباكة", en: "Plumbing" },
    electrical: { ar: "كهرباء", en: "Electrical" },
    ac_heating: { ar: "تكييف/تدفئة", en: "AC/Heating" },
    appliance: { ar: "أجهزة", en: "Appliance" },
    structural: { ar: "هيكلي", en: "Structural" },
    pest: { ar: "حشرات", en: "Pest Control" },
    security: { ar: "أمن", en: "Security" },
    other: { ar: "أخرى", en: "Other" },
  };
  const urg = urgencyLabels[urgency] || urgencyLabels.medium;
  const cat = lang === "ar" ? categoryLabels[category]?.ar || category : categoryLabels[category]?.en || category;
  const urgLabel = lang === "ar" ? urg.ar : urg.en;
  const content = lang === "ar" ? `
    <h2>🚨 طلب صيانة طوارئ جديد #${ticketId}</h2>
    <p>تم تقديم طلب صيانة طوارئ جديد من المستأجر <strong>${tenantName}</strong>:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">رقم الطلب</span><span class="info-value">#${ticketId}</span></div>
      <div class="info-row"><span class="info-label">العنوان</span><span class="info-value">${title}</span></div>
      <div class="info-row"><span class="info-label">الأولوية</span><span class="info-value" style="color:${urg.color};font-weight:bold">${urgLabel}</span></div>
      <div class="info-row"><span class="info-label">التصنيف</span><span class="info-value">${cat}</span></div>
      ${imageCount > 0 ? `<div class="info-row"><span class="info-label">المرفقات</span><span class="info-value">${imageCount} ملف</span></div>` : ""}
    </div>
    <p><strong>الوصف:</strong></p>
    <p>${description}</p>
    <p>يرجى مراجعة الطلب واتخاذ الإجراء المناسب من لوحة التحكم.</p>
  ` : `
    <h2>🚨 New Emergency Maintenance Request #${ticketId}</h2>
    <p>A new emergency maintenance request has been submitted by <strong>${tenantName}</strong>:</p>
    <div class="info-box">
      <div class="info-row"><span class="info-label">Ticket</span><span class="info-value">#${ticketId}</span></div>
      <div class="info-row"><span class="info-label">Title</span><span class="info-value">${title}</span></div>
      <div class="info-row"><span class="info-label">Urgency</span><span class="info-value" style="color:${urg.color};font-weight:bold">${urgLabel}</span></div>
      <div class="info-row"><span class="info-label">Category</span><span class="info-value">${cat}</span></div>
      ${imageCount > 0 ? `<div class="info-row"><span class="info-label">Attachments</span><span class="info-value">${imageCount} file(s)</span></div>` : ""}
    </div>
    <p><strong>Description:</strong></p>
    <p>${description}</p>
    <p>Please review the request and take appropriate action from the admin dashboard.</p>
  `;
  return sendEmail({
    to: adminEmail,
    subject: lang === "ar" ? `🚨 طلب صيانة طوارئ #${ticketId} — ${urgLabel} — المفتاح الشهري` : `🚨 Emergency Maintenance #${ticketId} — ${urgLabel} — المفتاح الشهري`,
    html: baseTemplate(content, lang),
  });
}
