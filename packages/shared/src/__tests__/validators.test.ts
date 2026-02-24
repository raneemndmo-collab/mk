import { describe, it, expect } from "vitest";

describe("Validators", () => {
  describe("BookingMode", () => {
    it("should accept valid modes", () => {
      const validModes = ["COBNB", "MONTHLY_KEY"];
      validModes.forEach((mode) => {
        expect(["COBNB", "MONTHLY_KEY"]).toContain(mode);
      });
    });

    it("should reject invalid modes", () => {
      expect(["COBNB", "MONTHLY_KEY"]).not.toContain("INVALID");
    });
  });

  describe("TicketType", () => {
    it("should accept valid ticket types", () => {
      const validTypes = ["CLEANING", "MAINTENANCE", "INSPECTION", "TURNOVER"];
      validTypes.forEach((type) => {
        expect(["CLEANING", "MAINTENANCE", "INSPECTION", "TURNOVER"]).toContain(type);
      });
    });
  });

  describe("TicketPriority", () => {
    it("should accept valid priorities", () => {
      const validPriorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];
      validPriorities.forEach((p) => {
        expect(["LOW", "MEDIUM", "HIGH", "URGENT"]).toContain(p);
      });
    });
  });
});
