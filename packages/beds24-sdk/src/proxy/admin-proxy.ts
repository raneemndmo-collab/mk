/**
 * SAFE ADMIN-ONLY Beds24 Passthrough Proxy
 *
 * POST /v1/admin/beds24/proxy
 * Body: { method, path, query, body }
 *
 * Rules:
 * - Only allow paths starting with /api/v2/
 * - Block dangerous operations unless role=ADMIN and ENABLE_BEDS24_PROXY=true
 * - Log every request/response to audit_log (redact PII)
 */

import { Beds24Client } from "../auth/client.js";
import type { Beds24ProxyRequest, Beds24ProxyResponse } from "@mk/shared";

const BLOCKED_PATHS = [
  "/api/v2/authentication",
  "/api/v2/account",
];

const DANGEROUS_WRITE_PATHS = [
  "/api/v2/properties",
  "/api/v2/rooms",
];

export interface ProxyAuditEntry {
  method: string;
  path: string;
  query?: Record<string, string>;
  bodyRedacted: unknown;
  responseStatus: number;
  timestamp: string;
}

function redactPII(obj: unknown): unknown {
  if (!obj || typeof obj !== "object") return obj;
  const redacted = { ...(obj as Record<string, unknown>) };
  const piiKeys = ["email", "phone", "guestEmail", "guestPhone", "address", "firstName", "lastName"];
  for (const key of piiKeys) {
    if (key in redacted) {
      redacted[key] = "***REDACTED***";
    }
  }
  return redacted;
}

export class Beds24AdminProxy {
  constructor(private client: Beds24Client) {}

  /**
   * Execute a proxy request.
   * Caller is responsible for checking role=ADMIN and ENABLE_BEDS24_PROXY=true.
   */
  async execute(
    req: Beds24ProxyRequest,
    options?: { allowDangerousWrites?: boolean }
  ): Promise<{ response: Beds24ProxyResponse; audit: ProxyAuditEntry }> {
    // Validate path
    if (!req.path.startsWith("/api/v2/")) {
      throw new ProxyError("Path must start with /api/v2/", 400);
    }

    // Block authentication/account endpoints
    for (const blocked of BLOCKED_PATHS) {
      if (req.path.startsWith(blocked)) {
        throw new ProxyError(`Path ${blocked} is blocked for proxy access`, 403);
      }
    }

    // Block dangerous writes unless explicitly allowed
    if (req.method !== "GET" && !options?.allowDangerousWrites) {
      for (const dangerous of DANGEROUS_WRITE_PATHS) {
        if (req.path.startsWith(dangerous)) {
          throw new ProxyError(
            `Write operations on ${dangerous} require allowDangerousWrites flag`,
            403
          );
        }
      }
    }

    const result = await this.client.request(req.method, req.path, {
      query: req.query,
      body: req.body,
    });

    const audit: ProxyAuditEntry = {
      method: req.method,
      path: req.path,
      query: req.query,
      bodyRedacted: redactPII(req.body),
      responseStatus: result.status,
      timestamp: new Date().toISOString(),
    };

    return {
      response: { status: result.status, data: result.data },
      audit,
    };
  }
}

export class ProxyError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = "ProxyError";
  }
}
