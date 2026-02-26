// ─── Production Fail-Fast Validation ─────────────────────────────────────────
// In production, critical secrets MUST be explicitly set. The server refuses to
// start with default/weak values to prevent catastrophic security failures.
const isProduction = process.env.NODE_ENV === "production" || !!process.env.RAILWAY_ENVIRONMENT;

function requireProductionSecret(name: string, value: string | undefined, minLength: number): string {
  const fallbacks = [
    "local-jwt-secret-key-for-development-only-change-in-production",
    "dev-otp-pepper-change-in-production",
  ];
  if (isProduction) {
    if (!value || value.length < minLength || fallbacks.includes(value)) {
      console.error(`\n[FATAL] ${name} is missing, too short (min ${minLength} chars), or uses a default value.`);
      console.error(`[FATAL] Set a strong ${name} in your environment variables before starting in production.`);
      console.error(`[FATAL] Generate one with: node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"\n`);
      process.exit(1);
    }
    return value;
  }
  // In development, allow fallback with a warning
  if (!value || fallbacks.includes(value)) {
    const fallback = name === "JWT_SECRET"
      ? "local-jwt-secret-key-for-development-only-change-in-production"
      : "dev-otp-pepper-change-in-production";
    console.warn(`[WARN] ${name} not set — using insecure development fallback. DO NOT use in production.`);
    return value || fallback;
  }
  return value;
}

// ─── Session Configuration ───────────────────────────────────────────────────
// Access token TTL: 30 minutes in production, 24 hours in development.
// This replaces the previous 365-day (ONE_YEAR_MS) session lifetime.
const SESSION_TTL_MS = isProduction
  ? parseInt(process.env.SESSION_TTL_MS ?? String(30 * 60 * 1000))   // 30 minutes
  : parseInt(process.env.SESSION_TTL_MS ?? String(24 * 60 * 60 * 1000)); // 24 hours (dev)

export const ENV = {
  appId: process.env.VITE_APP_ID ?? "monthly-key-local",
  cookieSecret: requireProductionSecret("JWT_SECRET", process.env.JWT_SECRET, 64),
  databaseUrl: process.env.DATABASE_URL ?? "mysql://root:password@localhost:3306/monthly_rental",
  isProduction,
  sessionTtlMs: SESSION_TTL_MS,
  // Redis URL for distributed cache/rate-limiting (optional in dev)
  redisUrl: process.env.REDIS_URL ?? "",
  // OpenAI API - used for LLM, Image Generation, Voice Transcription
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiBaseUrl: process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  openaiImageModel: process.env.OPENAI_IMAGE_MODEL ?? "dall-e-3",
  openaiWhisperModel: process.env.OPENAI_WHISPER_MODEL ?? "whisper-1",
  // Legacy Forge API vars (mapped to OpenAI for backward compat)
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? process.env.OPENAI_API_KEY ?? "",
  // Local file storage
  uploadDir: process.env.UPLOAD_DIR ?? "uploads",
  publicUrl: process.env.PUBLIC_URL ?? "", // Auto-detected from request if empty
  maxUploadSize: parseInt(process.env.MAX_UPLOAD_SIZE ?? "52428800"), // 50MB
  // SMTP Email Configuration
  smtpHost: process.env.SMTP_HOST ?? "localhost",
  smtpPort: parseInt(process.env.SMTP_PORT ?? "587"),
  smtpUser: process.env.SMTP_USER ?? "noreply@localhost",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "noreply@localhost",
  smtpSecure: process.env.SMTP_SECURE === "true",
  // Push Notifications (VAPID) - local web-push
  vapidPublicKey: process.env.VITE_VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",
  // OTP / Verification
  otpSecretPepper: requireProductionSecret("OTP_SECRET_PEPPER", process.env.OTP_SECRET_PEPPER, 32),
  otpTtlSeconds: parseInt(process.env.OTP_TTL_SECONDS ?? "300"),
  smsProvider: process.env.SMS_PROVIDER ?? "dev",
  smsApiKey: process.env.SMS_API_KEY ?? "",
  emailProvider: process.env.EMAIL_PROVIDER ?? "dev",
  emailApiKey: process.env.EMAIL_API_KEY ?? "",
};
