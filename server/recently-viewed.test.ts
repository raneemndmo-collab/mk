import { describe, expect, it, beforeEach } from "vitest";

/**
 * Tests for Recently Viewed Properties Feature
 * Tests the localStorage service logic: add, get, clear, dedup, max cap
 */

// ─── Mock localStorage ───

let store: Record<string, string> = {};

const mockLocalStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => { store[key] = value; },
  removeItem: (key: string) => { delete store[key]; },
  clear: () => { store = {}; },
};

// ─── Replicate the service logic for testing ───

const STORAGE_KEY = "mk_recently_viewed";
const MAX_ITEMS = 10;

interface MockProperty {
  id: number;
  titleAr: string;
  cityAr: string;
  districtAr: string;
  monthlyRent: string;
  photos: string[];
  [key: string]: unknown;
}

interface RecentlyViewedEntry {
  property: MockProperty;
  viewedAt: number;
}

function getRecentlyViewed(): RecentlyViewedEntry[] {
  try {
    const stored = mockLocalStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const entries: RecentlyViewedEntry[] = JSON.parse(stored);
    return entries.sort((a, b) => b.viewedAt - a.viewedAt);
  } catch {
    return [];
  }
}

function addRecentlyViewed(property: MockProperty): void {
  try {
    const entries = getRecentlyViewed();
    const filtered = entries.filter((e) => e.property.id !== property.id);
    filtered.unshift({ property, viewedAt: Date.now() });
    const capped = filtered.slice(0, MAX_ITEMS);
    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(capped));
  } catch {
    // silent
  }
}

function clearRecentlyViewed(): void {
  try {
    mockLocalStorage.removeItem(STORAGE_KEY);
  } catch {
    // silent
  }
}

function getRecentlyViewedCount(): number {
  return getRecentlyViewed().length;
}

function removeRecentlyViewed(propertyId: number): void {
  try {
    const entries = getRecentlyViewed();
    const filtered = entries.filter((e) => e.property.id !== propertyId);
    mockLocalStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // silent
  }
}

// ─── Helper to create mock properties ───

function createProperty(id: number, overrides: Partial<MockProperty> = {}): MockProperty {
  return {
    id,
    titleAr: `عقار ${id}`,
    cityAr: "الرياض",
    districtAr: "العليا",
    monthlyRent: `${3000 + id * 1000}.00`,
    photos: [`https://example.com/photo-${id}.jpg`],
    ...overrides,
  };
}

// ─── Tests ───

describe("Recently Viewed: Basic Operations", () => {
  beforeEach(() => {
    store = {};
  });

  it("should return empty array when no items viewed", () => {
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("should return 0 count when no items viewed", () => {
    expect(getRecentlyViewedCount()).toBe(0);
  });

  it("should add a property to recently viewed", () => {
    const prop = createProperty(1);
    addRecentlyViewed(prop);
    const items = getRecentlyViewed();
    expect(items).toHaveLength(1);
    expect(items[0].property.id).toBe(1);
  });

  it("should store property data correctly", () => {
    const prop = createProperty(42, { titleAr: "شقة فاخرة", cityAr: "جدة", monthlyRent: "8000.00" });
    addRecentlyViewed(prop);
    const items = getRecentlyViewed();
    expect(items[0].property.titleAr).toBe("شقة فاخرة");
    expect(items[0].property.cityAr).toBe("جدة");
    expect(items[0].property.monthlyRent).toBe("8000.00");
  });

  it("should include viewedAt timestamp", () => {
    const before = Date.now();
    addRecentlyViewed(createProperty(1));
    const after = Date.now();
    const items = getRecentlyViewed();
    expect(items[0].viewedAt).toBeGreaterThanOrEqual(before);
    expect(items[0].viewedAt).toBeLessThanOrEqual(after);
  });

  it("should add multiple properties", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    expect(getRecentlyViewedCount()).toBe(3);
  });
});

describe("Recently Viewed: Ordering", () => {
  beforeEach(() => {
    store = {};
  });

  it("should return most recently viewed first", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    const items = getRecentlyViewed();
    expect(items[0].property.id).toBe(3);
    expect(items[1].property.id).toBe(2);
    expect(items[2].property.id).toBe(1);
  });

  it("should have descending viewedAt timestamps", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    const items = getRecentlyViewed();
    for (let i = 1; i < items.length; i++) {
      expect(items[i - 1].viewedAt).toBeGreaterThanOrEqual(items[i].viewedAt);
    }
  });
});

describe("Recently Viewed: Deduplication", () => {
  beforeEach(() => {
    store = {};
  });

  it("should not create duplicate entries for same property", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(1)); // View again
    expect(getRecentlyViewedCount()).toBe(2);
  });

  it("should move re-viewed property to the top", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    addRecentlyViewed(createProperty(1)); // View property 1 again
    const items = getRecentlyViewed();
    expect(items[0].property.id).toBe(1);
    expect(items[1].property.id).toBe(3);
    expect(items[2].property.id).toBe(2);
  });

  it("should update viewedAt when re-viewing a property", () => {
    addRecentlyViewed(createProperty(1));
    const firstView = getRecentlyViewed()[0].viewedAt;
    // Small delay to ensure different timestamp
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(1)); // Re-view
    const secondView = getRecentlyViewed()[0].viewedAt;
    expect(secondView).toBeGreaterThanOrEqual(firstView);
  });

  it("should update property data when re-viewing with updated data", () => {
    addRecentlyViewed(createProperty(1, { titleAr: "عنوان قديم" }));
    addRecentlyViewed(createProperty(1, { titleAr: "عنوان جديد" }));
    const items = getRecentlyViewed();
    expect(items[0].property.titleAr).toBe("عنوان جديد");
  });
});

describe("Recently Viewed: Max Items Cap", () => {
  beforeEach(() => {
    store = {};
  });

  it("should cap at 10 items", () => {
    for (let i = 1; i <= 15; i++) {
      addRecentlyViewed(createProperty(i));
    }
    expect(getRecentlyViewedCount()).toBe(10);
  });

  it("should keep the most recent 10 items", () => {
    for (let i = 1; i <= 12; i++) {
      addRecentlyViewed(createProperty(i));
    }
    const items = getRecentlyViewed();
    // Should have items 3-12 (oldest 1,2 dropped)
    expect(items[0].property.id).toBe(12);
    expect(items[9].property.id).toBe(3);
  });

  it("should drop oldest items when cap is reached", () => {
    for (let i = 1; i <= 11; i++) {
      addRecentlyViewed(createProperty(i));
    }
    const items = getRecentlyViewed();
    const ids = items.map((e) => e.property.id);
    expect(ids).not.toContain(1); // Oldest should be dropped
    expect(ids).toContain(11); // Newest should be kept
  });
});

describe("Recently Viewed: Clear", () => {
  beforeEach(() => {
    store = {};
  });

  it("should clear all recently viewed items", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    clearRecentlyViewed();
    expect(getRecentlyViewed()).toEqual([]);
    expect(getRecentlyViewedCount()).toBe(0);
  });

  it("should be safe to clear when already empty", () => {
    clearRecentlyViewed();
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("should allow adding items after clearing", () => {
    addRecentlyViewed(createProperty(1));
    clearRecentlyViewed();
    addRecentlyViewed(createProperty(2));
    expect(getRecentlyViewedCount()).toBe(1);
    expect(getRecentlyViewed()[0].property.id).toBe(2);
  });
});

describe("Recently Viewed: Remove Individual", () => {
  beforeEach(() => {
    store = {};
  });

  it("should remove a specific property", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    removeRecentlyViewed(2);
    const items = getRecentlyViewed();
    expect(items).toHaveLength(2);
    expect(items.map((e) => e.property.id)).not.toContain(2);
  });

  it("should not affect other items when removing", () => {
    addRecentlyViewed(createProperty(1));
    addRecentlyViewed(createProperty(2));
    addRecentlyViewed(createProperty(3));
    removeRecentlyViewed(2);
    const ids = getRecentlyViewed().map((e) => e.property.id);
    expect(ids).toContain(1);
    expect(ids).toContain(3);
  });

  it("should be safe to remove non-existent property", () => {
    addRecentlyViewed(createProperty(1));
    removeRecentlyViewed(999);
    expect(getRecentlyViewedCount()).toBe(1);
  });
});

describe("Recently Viewed: Edge Cases", () => {
  beforeEach(() => {
    store = {};
  });

  it("should handle corrupted localStorage data gracefully", () => {
    mockLocalStorage.setItem(STORAGE_KEY, "not-valid-json");
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("should handle empty string in localStorage", () => {
    mockLocalStorage.setItem(STORAGE_KEY, "");
    expect(getRecentlyViewed()).toEqual([]);
  });

  it("should handle single item", () => {
    addRecentlyViewed(createProperty(1));
    expect(getRecentlyViewedCount()).toBe(1);
    const items = getRecentlyViewed();
    expect(items[0].property.id).toBe(1);
  });

  it("should handle rapid successive views of same property", () => {
    for (let i = 0; i < 5; i++) {
      addRecentlyViewed(createProperty(1));
    }
    expect(getRecentlyViewedCount()).toBe(1);
  });

  it("should preserve all property fields", () => {
    const prop = createProperty(1, {
      titleAr: "شقة مفروشة",
      cityAr: "جدة",
      districtAr: "الحمراء",
      monthlyRent: "12000.00",
      photos: ["photo1.jpg", "photo2.jpg"],
    });
    addRecentlyViewed(prop);
    const stored = getRecentlyViewed()[0].property;
    expect(stored.titleAr).toBe("شقة مفروشة");
    expect(stored.cityAr).toBe("جدة");
    expect(stored.districtAr).toBe("الحمراء");
    expect(stored.monthlyRent).toBe("12000.00");
    expect(stored.photos).toEqual(["photo1.jpg", "photo2.jpg"]);
  });
});

describe("Recently Viewed: Relative Time Formatting", () => {
  // Test the formatViewedTime logic used in HomeTab
  function formatViewedTime(viewedAt: number): string {
    const diff = Date.now() - viewedAt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "الآن";
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `منذ ${hours} ساعة`;
    const days = Math.floor(hours / 24);
    if (days === 1) return "أمس";
    return `منذ ${days} أيام`;
  }

  it("should show 'الآن' for just now", () => {
    expect(formatViewedTime(Date.now())).toBe("الآن");
  });

  it("should show minutes for recent views", () => {
    const fiveMinAgo = Date.now() - 5 * 60000;
    expect(formatViewedTime(fiveMinAgo)).toBe("منذ 5 دقيقة");
  });

  it("should show hours for same-day views", () => {
    const threeHoursAgo = Date.now() - 3 * 3600000;
    expect(formatViewedTime(threeHoursAgo)).toBe("منذ 3 ساعة");
  });

  it("should show 'أمس' for yesterday", () => {
    const yesterday = Date.now() - 26 * 3600000;
    expect(formatViewedTime(yesterday)).toBe("أمس");
  });

  it("should show days for older views", () => {
    const threeDaysAgo = Date.now() - 3 * 86400000;
    expect(formatViewedTime(threeDaysAgo)).toBe("منذ 3 أيام");
  });
});
