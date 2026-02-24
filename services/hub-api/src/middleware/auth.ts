import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import type { UserRole } from "@mk/shared";

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthPayload;
    }
  }
}

/** Require valid JWT. */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Missing or invalid token" });
  }

  try {
    const payload = jwt.verify(header.slice(7), config.jwtSecret) as AuthPayload;
    req.auth = payload;
    next();
  } catch {
    return res.status(401).json({ code: "UNAUTHORIZED", message: "Invalid or expired token" });
  }
}

/** Require one of the specified roles. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.auth) {
      return res.status(401).json({ code: "UNAUTHORIZED", message: "Not authenticated" });
    }
    if (!roles.includes(req.auth.role)) {
      return res.status(403).json({ code: "FORBIDDEN", message: "Insufficient permissions" });
    }
    next();
  };
}

/** Optional auth — sets req.auth if token present, but doesn't block. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    try {
      req.auth = jwt.verify(header.slice(7), config.jwtSecret) as AuthPayload;
    } catch {
      // Ignore invalid tokens for optional auth
    }
  }
  next();
}
