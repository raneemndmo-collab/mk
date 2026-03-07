/**
 * Security utilities for the Ijar platform
 * - Input sanitization (XSS prevention)
 * - File upload validation
 * - Pagination caps
 * - Authorization helpers
 */

// ─── XSS Sanitization ────────────────────────────────────────────────

const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;',
};

/** Strip dangerous HTML/script tags from user input */
export function sanitizeText(input: string): string {
  if (!input) return input;
  return input
    .replace(/[&<>"'/]/g, (char) => HTML_ENTITIES[char] || char)
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/javascript:/gi, '');
}

/** Sanitize object values recursively (only string values) */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = sanitizeText(value);
    } else if (Array.isArray(value)) {
      result[key] = value.map(v => typeof v === 'string' ? sanitizeText(v) : v);
    } else {
      result[key] = value;
    }
  }
  return result;
}

// ─── File Upload Validation ──────────────────────────────────────────

/** Max base64 size: ~10MB decoded (base64 is ~33% larger) */
export const MAX_BASE64_SIZE = 14_000_000; // ~10MB file

/** Max avatar base64 size: ~2MB */
export const MAX_AVATAR_BASE64_SIZE = 3_000_000; // ~2MB file

/** Allowed image MIME types */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // 'image/svg+xml', // Removed: SVG files can contain embedded JavaScript (XSS vector)
];

/** Allowed document MIME types */
export const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

/** Allowed video MIME types */
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
];

/** All allowed upload types */
export const ALLOWED_UPLOAD_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOC_TYPES,
  ...ALLOWED_VIDEO_TYPES,
];

/** Validate content type against allowed list */
export function validateContentType(contentType: string, allowed: string[] = ALLOWED_UPLOAD_TYPES): boolean {
  return allowed.includes(contentType.toLowerCase().trim());
}

/** Validate file extension against content type */
export function validateFileExtension(filename: string, contentType: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (!ext) return false;
  
  const extToMime: Record<string, string[]> = {
    'jpg': ['image/jpeg', 'image/jpg'],
    'jpeg': ['image/jpeg', 'image/jpg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    // 'svg': ['image/svg+xml'], // Removed: SVG XSS vector
    'pdf': ['application/pdf'],
    'doc': ['application/msword'],
    'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    'txt': ['text/plain'],
    'mp4': ['video/mp4'],
    'webm': ['video/webm'],
    'mov': ['video/quicktime'],
  };
  
  const allowedMimes = extToMime[ext];
  if (!allowedMimes) return false;
  return allowedMimes.includes(contentType.toLowerCase().trim());
}

// ─── Pagination ──────────────────────────────────────────────────────

/** Cap pagination limit to prevent data dumping */
export function capLimit(limit: number | undefined, defaultLimit: number = 20, maxLimit: number = 100): number {
  if (!limit || limit < 1) return defaultLimit;
  return Math.min(limit, maxLimit);
}

/** Cap offset to prevent unreasonable values */
export function capOffset(offset: number | undefined, maxOffset: number = 100000): number {
  if (!offset || offset < 0) return 0;
  return Math.min(offset, maxOffset);
}

// ─── Authorization Helpers ───────────────────────────────────────────

export interface AuthUser {
  id: number;
  role: string;
  [key: string]: any;
}

/** Check if user owns a resource or is admin */
export function isOwnerOrAdmin(user: AuthUser, ownerId: number): boolean {
  return user.id === ownerId || user.role === 'admin';
}

/** Check if user is involved in a booking (tenant or landlord) */
export function isBookingParticipant(user: AuthUser, booking: { tenantId: number; landlordId: number }): boolean {
  return user.id === booking.tenantId || user.id === booking.landlordId || user.role === 'admin';
}
