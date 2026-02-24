/**
 * Compression Middleware
 * Applies Gzip compression to all text-based responses (HTML, CSS, JS, JSON).
 * This typically reduces transfer sizes by 60-80%, significantly improving
 * page load times for users on slower connections.
 */
import compression from "compression";
import type { Request, Response } from "express";

// Only compress responses larger than 1KB and text-based content types
export const compressionMiddleware = compression({
  level: 6, // Balanced between compression ratio and CPU usage
  threshold: 1024, // Don't compress responses smaller than 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress if the client doesn't support it
    if (req.headers["x-no-compression"]) {
      return false;
    }
    // Use compression's default filter (compresses text-based types)
    return compression.filter(req, res);
  },
});
