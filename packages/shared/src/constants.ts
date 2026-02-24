export const BRAND_RULES = {
  COBNB: {
    minNights: 1,
    maxNights: 27,
    label: "CoBnB KSA",
    labelAr: "كو بي إن بي",
  },
  MONTHLYKEY: {
    minNights: 28,
    maxNights: 365,
    label: "Monthly Key",
    labelAr: "المفتاح الشهري",
  },
} as const;

export const TICKET_SLA_HOURS: Record<string, number> = {
  CLEANING: 4,
  MAINTENANCE: 24,
  INSPECTION: 8,
  GUEST_ISSUE: 2,
};

export const CHECKOUT_CLEANING_BUFFER_MINUTES = 60;

export const SAUDI_CITIES = [
  "الرياض",
  "جدة",
  "الدمام",
  "مكة المكرمة",
  "المدينة المنورة",
  "الخبر",
  "الطائف",
  "تبوك",
  "أبها",
  "الجبيل",
] as const;

export const FEATURE_FLAG_KEYS = [
  "ENABLE_BEDS24",
  "ENABLE_BEDS24_WEBHOOKS",
  "ENABLE_BEDS24_PROXY",
  "ENABLE_AUTOMATED_TICKETS",
  "ENABLE_PAYMENTS",
  "ENABLE_BANK_TRANSFER",
] as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL: 500,
} as const;
