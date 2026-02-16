import { describe, it, expect, vi } from "vitest";

// Mock sharp before importing image-optimizer
vi.mock("sharp", () => {
  const mockSharp = vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue({
      data: Buffer.from("fake-webp-data"),
      info: { width: 800, height: 600, size: 1024, format: "webp" },
    }),
    metadata: vi.fn().mockResolvedValue({
      width: 1920,
      height: 1080,
      format: "jpeg",
    }),
  }));
  return { default: mockSharp };
});

// Mock storage
vi.mock("./storage", () => ({
  storagePut: vi.fn().mockResolvedValue({
    key: "test/image.webp",
    url: "https://cdn.example.com/test/image.webp",
  }),
}));

// Mock nanoid
vi.mock("nanoid", () => ({
  nanoid: vi.fn(() => "abc123test"),
}));

import { optimizeImage, optimizeAvatar, getImageMetadata } from "./image-optimizer";

describe("Image Optimizer", () => {
  describe("optimizeImage", () => {
    it("should generate three variants: original, medium, thumbnail", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "photo.jpg");

      expect(result).toHaveProperty("original");
      expect(result).toHaveProperty("medium");
      expect(result).toHaveProperty("thumbnail");
    });

    it("should return WebP format for all variants", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "photo.jpg");

      expect(result.original.format).toBe("webp");
      expect(result.medium.format).toBe("webp");
      expect(result.thumbnail.format).toBe("webp");
    });

    it("should include URLs for all variants", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "photo.jpg");

      expect(result.original.url).toBeTruthy();
      expect(result.medium.url).toBeTruthy();
      expect(result.thumbnail.url).toBeTruthy();
    });

    it("should include dimensions for all variants", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "photo.jpg");

      expect(result.original.width).toBeGreaterThan(0);
      expect(result.original.height).toBeGreaterThan(0);
      expect(result.medium.width).toBeGreaterThan(0);
      expect(result.thumbnail.width).toBeGreaterThan(0);
    });

    it("should include file size for all variants", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "photo.jpg");

      expect(result.original.size).toBeGreaterThan(0);
      expect(result.medium.size).toBeGreaterThan(0);
      expect(result.thumbnail.size).toBeGreaterThan(0);
    });

    it("should strip extension from filename in key", async () => {
      const buffer = Buffer.from("fake-image-data");
      const result = await optimizeImage(buffer, "properties/1", "my-photo.jpeg");

      expect(result.original.key).toContain("my-photo-original");
      expect(result.medium.key).toContain("my-photo-medium");
      expect(result.thumbnail.key).toContain("my-photo-thumbnail");
    });
  });

  describe("optimizeAvatar", () => {
    it("should return url and key", async () => {
      const buffer = Buffer.from("fake-avatar-data");
      const result = await optimizeAvatar(buffer, "avatars/1");

      expect(result).toHaveProperty("url");
      expect(result).toHaveProperty("key");
      expect(result.url).toBeTruthy();
      expect(result.key).toContain("avatar-");
    });
  });

  describe("getImageMetadata", () => {
    it("should return image dimensions and format", async () => {
      const buffer = Buffer.from("fake-image-data");
      const metadata = await getImageMetadata(buffer);

      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBe(1080);
      expect(metadata.format).toBe("jpeg");
      expect(metadata.size).toBeGreaterThan(0);
    });
  });
});
