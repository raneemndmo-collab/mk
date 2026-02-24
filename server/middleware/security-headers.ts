/**
 * Security Headers Middleware
 * Applies essential HTTP security headers to all responses.
 * These headers protect against common web vulnerabilities without
 * changing the visual design or functionality of the site.
 */
import type { Request, Response, NextFunction } from "express";

export function securityHeaders(req: Request, res: Response, next: NextFunction): void {
  // ─── HSTS: Force HTTPS for 1 year ─────────────────────────────────
  // Only set in production to avoid issues with local development
  if (process.env.NODE_ENV === "production") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // ─── Prevent MIME type sniffing ────────────────────────────────────
  res.setHeader("X-Content-Type-Options", "nosniff");

  // ─── Clickjacking protection ──────────────────────────────────────
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // ─── Referrer Policy ──────────────────────────────────────────────
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // ─── Permissions Policy ───────────────────────────────────────────
  // Restrict access to sensitive browser APIs
  res.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self), payment=(self), usb=()"
  );

  // ─── Content Security Policy (Report-Only mode for safety) ────────
  // Start with report-only to avoid breaking existing functionality.
  // Once verified, switch to enforcing mode by changing the header name
  // from "Content-Security-Policy-Report-Only" to "Content-Security-Policy".
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://cdn.jsdelivr.net",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "media-src 'self' https://cdn.jsdelivr.net blob:",
    "connect-src 'self' https://www.google-analytics.com https://www.googletagmanager.com https://maps.googleapis.com https://*.paypal.com",
    "frame-src 'self' https://*.paypal.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join("; ");

  res.setHeader("Content-Security-Policy-Report-Only", csp);

  // ─── Remove X-Powered-By to reduce fingerprinting ─────────────────
  res.removeHeader("X-Powered-By");

  next();
}
