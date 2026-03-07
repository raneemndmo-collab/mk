/**
 * Recently Viewed Properties Service
 * Persists recently viewed property data in localStorage
 * Max 10 items, most recent first, deduplicates by property ID
 */

import type { ApiProperty } from "./api";

const STORAGE_KEY = "mk_recently_viewed";
const MAX_ITEMS = 10;

export interface RecentlyViewedEntry {
  property: ApiProperty;
  viewedAt: number; // Unix timestamp ms
}

/**
 * Get all recently viewed properties, most recent first
 */
export function getRecentlyViewed(): RecentlyViewedEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const entries: RecentlyViewedEntry[] = JSON.parse(stored);
    // Sort by viewedAt descending (most recent first)
    return entries.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch {
    return [];
  }
}

/**
 * Add a property to recently viewed
 * Deduplicates: if property already exists, moves it to the top with updated timestamp
 * Caps at MAX_ITEMS entries
 */
export function addRecentlyViewed(property: ApiProperty): void {
  try {
    const entries = getRecentlyViewed();
    // Remove existing entry for this property (dedup)
    const filtered = entries.filter((e) => e.property.id !== property.id);
    // Add new entry at the beginning
    filtered.unshift({
      property,
      viewedAt: Date.now(),
    });
    // Cap at MAX_ITEMS
    const capped = filtered.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Clear all recently viewed properties
 */
export function clearRecentlyViewed(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Get the count of recently viewed properties
 */
export function getRecentlyViewedCount(): number {
  return getRecentlyViewed().length;
}

/**
 * Remove a specific property from recently viewed
 */
export function removeRecentlyViewed(propertyId: number): void {
  try {
    const entries = getRecentlyViewed();
    const filtered = entries.filter((e) => e.property.id !== propertyId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Silently fail
  }
}
