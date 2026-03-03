/**
 * Local Authentication Service
 *
 * Pure JWT-based session management. No external OAuth dependency.
 * Sessions are signed with HS256 using JWT_SECRET env var.
 * User identity is resolved from platform_users table via openId field.
 *
 * NOTE: The "openId" field in the database is kept for backward compatibility
 * with existing user rows. For local users it stores "local_<userId>".
 * No external OAuth server is contacted.
 */
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import { ForbiddenError } from "@shared/_core/errors";
import { parse as parseCookieHeader } from "cookie";
import type { Request } from "express";
import { SignJWT, jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { ENV } from "./env";
import { tokenBlacklist } from "../token-blacklist";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.length > 0;

export type SessionPayload = {
  /** Stored as "local_<userId>" for backward compat with DB openId column */
  openId: string;
  appId: string;
  name: string;
};

class AuthService {
  private parseCookies(cookieHeader: string | undefined) {
    if (!cookieHeader) {
      return new Map<string, string>();
    }
    const parsed = parseCookieHeader(cookieHeader);
    return new Map(Object.entries(parsed));
  }

  private getSessionSecret() {
    const secret = ENV.cookieSecret;
    return new TextEncoder().encode(secret);
  }

  /**
   * Create a session token for a local user.
   * @param openId - The user's openId string (e.g. "local_admin")
   * @param options - Optional name and expiry configuration
   */
  async createSessionToken(
    openId: string,
    options: { expiresInMs?: number; name?: string } = {}
  ): Promise<string> {
    return this.signSession(
      {
        openId,
        appId: ENV.appId,
        name: options.name || "",
      },
      options
    );
  }

  async signSession(
    payload: SessionPayload,
    options: { expiresInMs?: number } = {}
  ): Promise<string> {
    const issuedAt = Date.now();
    const expiresInMs = options.expiresInMs ?? ONE_YEAR_MS;
    const expirationSeconds = Math.floor((issuedAt + expiresInMs) / 1000);
    const secretKey = this.getSessionSecret();
    return new SignJWT({
      openId: payload.openId,
      appId: payload.appId,
      name: payload.name,
    })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(expirationSeconds)
      .sign(secretKey);
  }

  /**
   * Verify a session token and return the payload.
   * Returns null if the token is invalid, expired, or blacklisted (revoked).
   */
  async verifySession(
    cookieValue: string | undefined | null
  ): Promise<{ openId: string; appId: string; name: string } | null> {
    if (!cookieValue) {
      return null;
    }
    try {
      // Check if token has been revoked (blacklisted on logout)
      const revoked = await tokenBlacklist.isBlacklisted(cookieValue);
      if (revoked) {
        console.warn("[Auth] Token is blacklisted (revoked)");
        return null;
      }

      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const { openId, appId, name } = payload as Record<string, unknown>;

      if (
        !isNonEmptyString(openId) ||
        !isNonEmptyString(appId) ||
        !isNonEmptyString(name)
      ) {
        console.warn("[Auth] Session payload missing required fields");
        return null;
      }
      return { openId, appId, name };
    } catch (error) {
      console.warn("[Auth] Session verification failed", String(error));
      return null;
    }
  }

  /**
   * Revoke a session token by adding it to the blacklist.
   * The token remains blacklisted until its natural JWT expiry.
   */
  async revokeToken(cookieValue: string): Promise<void> {
    if (!cookieValue) return;
    try {
      // Decode (without verifying) to get the expiry time
      const secretKey = this.getSessionSecret();
      const { payload } = await jwtVerify(cookieValue, secretKey, {
        algorithms: ["HS256"],
      });
      const exp = payload.exp;
      if (exp) {
        const remainingMs = exp * 1000 - Date.now();
        if (remainingMs > 0) {
          await tokenBlacklist.add(cookieValue, remainingMs);
          console.log(`[Auth] Token blacklisted for ${Math.ceil(remainingMs / 1000)}s`);
        }
      } else {
        // No expiry — blacklist for session TTL as fallback
        await tokenBlacklist.add(cookieValue, ENV.sessionTtlMs);
      }
    } catch {
      // Token is already invalid/expired — no need to blacklist
    }
  }

  /**
   * Authenticate an incoming HTTP request.
   * Reads the session cookie, verifies the JWT, and resolves the user from the database.
   * Throws ForbiddenError if authentication fails.
   */
  async authenticateRequest(req: Request): Promise<User> {
    const cookies = this.parseCookies(req.headers.cookie);
    const sessionCookie = cookies.get(COOKIE_NAME);
    const session = await this.verifySession(sessionCookie);

    if (!session) {
      throw ForbiddenError("Invalid session cookie");
    }

    const sessionUserId = session.openId;
    const signedInAt = new Date();

    // Look up user by their openId field (which stores "local_<userId>")
    let user = await db.getUserByOpenId(sessionUserId);

    if (!user) {
      console.warn(`[Auth] User not found for session: ${sessionUserId}`);
      throw ForbiddenError("User not found. Please register or login.");
    }

    // Update last sign-in timestamp
    await db.upsertUser({
      openId: user.openId,
      lastSignedIn: signedInAt,
    });

    return user;
  }
}

export const sdk = new AuthService();
