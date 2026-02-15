import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the database module
vi.mock("./db", () => ({
  getAllManagersWithCounts: vi.fn(),
  getManagerWithProperties: vi.fn(),
  getManagerByEditToken: vi.fn(),
  updateManagerSelfProfile: vi.fn(),
  createPropertyManager: vi.fn(),
  updatePropertyManager: vi.fn(),
  deletePropertyManager: vi.fn(),
  assignManagerToProperties: vi.fn(),
  getManagerAssignments: vi.fn(),
  generateManagerEditToken: vi.fn(),
  getPropertyManagerById: vi.fn(),
}));

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://cdn.example.com/photo.jpg", key: "photo.jpg" }),
}));

import * as db from "./db";

describe("Property Manager Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllManagersWithCounts", () => {
    it("should return managers with property counts and assigned properties", async () => {
      const mockManagers = [
        {
          id: 1,
          name: "John Doe",
          nameAr: "جون دو",
          phone: "+966501234567",
          propertyCount: 3,
          assignedProperties: [
            { propertyId: 1, propertyTitle: "Luxury Apt" },
            { propertyId: 2, propertyTitle: "Modern Villa" },
            { propertyId: 3, propertyTitle: "Studio" },
          ],
        },
        {
          id: 2,
          name: "Jane Smith",
          nameAr: "جين سميث",
          phone: "+966509876543",
          propertyCount: 0,
          assignedProperties: [],
        },
      ];

      (db.getAllManagersWithCounts as any).mockResolvedValue(mockManagers);

      const result = await db.getAllManagersWithCounts();
      expect(result).toHaveLength(2);
      expect(result[0].propertyCount).toBe(3);
      expect(result[0].assignedProperties).toHaveLength(3);
      expect(result[1].propertyCount).toBe(0);
      expect(result[1].assignedProperties).toHaveLength(0);
    });
  });

  describe("getManagerWithProperties", () => {
    it("should return manager with full property details", async () => {
      const mockManager = {
        id: 1,
        name: "John Doe",
        nameAr: "جون دو",
        phone: "+966501234567",
        email: "john@example.com",
        bio: "Experienced property manager",
        bioAr: "مدير عقارات ذو خبرة",
        photoUrl: "https://cdn.example.com/john.jpg",
        properties: [
          { id: 1, titleEn: "Luxury Apt", titleAr: "شقة فاخرة", monthlyRent: "5000" },
        ],
        propertyCount: 1,
      };

      (db.getManagerWithProperties as any).mockResolvedValue(mockManager);

      const result = await db.getManagerWithProperties(1);
      expect(result).toBeDefined();
      expect(result!.name).toBe("John Doe");
      expect(result!.properties).toHaveLength(1);
      expect(result!.propertyCount).toBe(1);
    });

    it("should return null for non-existent manager", async () => {
      (db.getManagerWithProperties as any).mockResolvedValue(null);

      const result = await db.getManagerWithProperties(999);
      expect(result).toBeNull();
    });
  });

  describe("Self-service profile editing", () => {
    it("should get manager by edit token", async () => {
      const mockManager = {
        id: 1,
        name: "John Doe",
        nameAr: "جون دو",
        phone: "+966501234567",
        editToken: "abc123token",
      };

      (db.getManagerByEditToken as any).mockResolvedValue(mockManager);

      const result = await db.getManagerByEditToken("abc123token");
      expect(result).toBeDefined();
      expect(result!.name).toBe("John Doe");
    });

    it("should return null for invalid token", async () => {
      (db.getManagerByEditToken as any).mockResolvedValue(null);

      const result = await db.getManagerByEditToken("invalid-token");
      expect(result).toBeNull();
    });

    it("should update manager self profile", async () => {
      (db.updateManagerSelfProfile as any).mockResolvedValue(true);

      const result = await db.updateManagerSelfProfile("abc123token", {
        phone: "+966509999999",
        bio: "Updated bio",
        bioAr: "نبذة محدثة",
      });
      expect(result).toBe(true);
      expect(db.updateManagerSelfProfile).toHaveBeenCalledWith("abc123token", {
        phone: "+966509999999",
        bio: "Updated bio",
        bioAr: "نبذة محدثة",
      });
    });
  });

  describe("Admin CRUD operations", () => {
    it("should create a new property manager", async () => {
      const newManager = {
        name: "New Manager",
        nameAr: "مدير جديد",
        phone: "+966501111111",
        email: "new@example.com",
      };

      (db.createPropertyManager as any).mockResolvedValue({ id: 3, ...newManager });

      const result = await db.createPropertyManager(newManager as any);
      expect(result.id).toBe(3);
      expect(result.name).toBe("New Manager");
    });

    it("should update an existing property manager", async () => {
      (db.updatePropertyManager as any).mockResolvedValue(true);

      const result = await db.updatePropertyManager(1, { name: "Updated Name" } as any);
      expect(result).toBe(true);
      expect(db.updatePropertyManager).toHaveBeenCalledWith(1, { name: "Updated Name" });
    });

    it("should delete a property manager", async () => {
      (db.deletePropertyManager as any).mockResolvedValue(true);

      const result = await db.deletePropertyManager(1);
      expect(result).toBe(true);
    });

    it("should assign properties to a manager", async () => {
      (db.assignManagerToProperties as any).mockResolvedValue(true);

      const result = await db.assignManagerToProperties(1, [1, 2, 3]);
      expect(result).toBe(true);
      expect(db.assignManagerToProperties).toHaveBeenCalledWith(1, [1, 2, 3]);
    });

    it("should generate edit token for a manager", async () => {
      (db.generateManagerEditToken as any).mockResolvedValue("new-token-xyz");

      const result = await db.generateManagerEditToken(1);
      expect(result).toBe("new-token-xyz");
    });
  });
});
