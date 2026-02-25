import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Normalize media URLs from the server.
 * - Absolute URLs (http/https/data:) are returned as-is.
 * - Relative URLs (e.g. /uploads/...) are prefixed with window.location.origin
 *   so they resolve correctly regardless of how the page was loaded.
 * - Empty/null/undefined returns empty string (caller should show fallback).
 */
export function normalizeMediaUrl(url: string | null | undefined): string {
  if (!url || url.trim() === "") return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  // Relative URL — prefix with origin
  return `${window.location.origin}${url.startsWith("/") ? "" : "/"}${url}`;
}
