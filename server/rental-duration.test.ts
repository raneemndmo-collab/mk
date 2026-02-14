import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";

describe("Rental Duration Settings", () => {
  beforeAll(async () => {
    // Seed rental duration settings
    await db.bulkSetSettings({
      "rental.minMonths": "1",
      "rental.maxMonths": "12",
    });
  });

  it("should return rental.minMonths setting", async () => {
    const val = await db.getSetting("rental.minMonths");
    expect(val).toBe("1");
  });

  it("should return rental.maxMonths setting", async () => {
    const val = await db.getSetting("rental.maxMonths");
    expect(val).toBe("12");
  });

  it("should update rental.minMonths setting", async () => {
    await db.bulkSetSettings({ "rental.minMonths": "2" });
    const val = await db.getSetting("rental.minMonths");
    expect(val).toBe("2");
    // Reset
    await db.bulkSetSettings({ "rental.minMonths": "1" });
  });

  it("should update rental.maxMonths setting", async () => {
    await db.bulkSetSettings({ "rental.maxMonths": "6" });
    const val = await db.getSetting("rental.maxMonths");
    expect(val).toBe("6");
    // Reset
    await db.bulkSetSettings({ "rental.maxMonths": "12" });
  });

  it("should handle both min and max update together", async () => {
    await db.bulkSetSettings({
      "rental.minMonths": "2",
      "rental.maxMonths": "3",
    });
    const min = await db.getSetting("rental.minMonths");
    const max = await db.getSetting("rental.maxMonths");
    expect(min).toBe("2");
    expect(max).toBe("3");
    // Reset
    await db.bulkSetSettings({
      "rental.minMonths": "1",
      "rental.maxMonths": "12",
    });
  });

  it("should return null for non-existent rental setting", async () => {
    const val = await db.getSetting("rental.nonexistent");
    expect(val).toBeNull();
  });
});
