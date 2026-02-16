/**
 * Server-side image optimization using Sharp
 * Generates optimized variants (thumbnail, medium, original WebP) on upload
 */
import sharp from "sharp";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";

export interface ImageVariant {
  key: string;
  url: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

export interface OptimizedImageSet {
  original: ImageVariant;
  medium: ImageVariant;
  thumbnail: ImageVariant;
}

const VARIANTS = {
  thumbnail: { width: 400, height: 300, quality: 75 },
  medium: { width: 800, height: 600, quality: 80 },
  original: { width: 1600, height: 1200, quality: 85 },
} as const;

/**
 * Process an uploaded image buffer and generate optimized variants
 * Returns URLs for thumbnail, medium, and original (all as WebP)
 */
export async function optimizeImage(
  buffer: Buffer,
  basePath: string,
  originalFilename: string
): Promise<OptimizedImageSet> {
  const id = nanoid(10);
  const baseName = originalFilename.replace(/\.[^.]+$/, "");

  const results: Record<string, ImageVariant> = {};

  for (const [variant, config] of Object.entries(VARIANTS)) {
    try {
      const processed = await sharp(buffer)
        .resize(config.width, config.height, {
          fit: "cover",
          position: "centre",
          withoutEnlargement: true,
        })
        .webp({ quality: config.quality })
        .toBuffer({ resolveWithObject: true });

      const key = `${basePath}/${baseName}-${variant}-${id}.webp`;
      const { url } = await storagePut(key, processed.data, "image/webp");

      results[variant] = {
        key,
        url,
        width: processed.info.width,
        height: processed.info.height,
        format: "webp",
        size: processed.info.size,
      };
    } catch (err) {
      console.error(`[ImageOptimizer] Failed to process ${variant}:`, err);
      // Fallback: upload original as-is for this variant
      const key = `${basePath}/${baseName}-${variant}-${id}.jpg`;
      const { url } = await storagePut(key, buffer, "image/jpeg");
      results[variant] = {
        key,
        url,
        width: config.width,
        height: config.height,
        format: "jpeg",
        size: buffer.length,
      };
    }
  }

  return {
    original: results.original!,
    medium: results.medium!,
    thumbnail: results.thumbnail!,
  };
}

/**
 * Quick resize for profile photos / avatars (single variant)
 */
export async function optimizeAvatar(
  buffer: Buffer,
  basePath: string
): Promise<{ url: string; key: string }> {
  const id = nanoid(10);
  const processed = await sharp(buffer)
    .resize(256, 256, { fit: "cover", position: "centre" })
    .webp({ quality: 80 })
    .toBuffer();

  const key = `${basePath}/avatar-${id}.webp`;
  const { url } = await storagePut(key, processed, "image/webp");
  return { url, key };
}

/**
 * Get image metadata (dimensions, format, size)
 */
export async function getImageMetadata(buffer: Buffer) {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || "unknown",
    size: buffer.length,
  };
}
