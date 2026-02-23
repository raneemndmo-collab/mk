/**
 * Local file storage - replaces Manus S3 proxy
 * Files are stored on the local filesystem under UPLOAD_DIR
 * Served via /uploads/* static route
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { ENV } from './_core/env';

// Ensure upload directory exists
const getUploadDir = () => {
  const dir = path.resolve(ENV.uploadDir || "uploads");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

/**
 * Detect the public base URL from environment or fallback
 */
function getPublicBaseUrl(): string {
  if (ENV.publicUrl) return ENV.publicUrl.replace(/\/+$/, "");
  return "";
}

/**
 * Store a file locally and return its public URL
 */
export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const uploadDir = getUploadDir();
  const key = normalizeKey(relKey);

  // Create subdirectories if needed
  const fullPath = path.join(uploadDir, key);
  const dirPath = path.dirname(fullPath);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  // Write file
  const buffer = typeof data === "string" ? Buffer.from(data) : Buffer.from(data);
  fs.writeFileSync(fullPath, buffer);

  // Build public URL
  const baseUrl = getPublicBaseUrl();
  const url = `${baseUrl}/uploads/${key}`;

  console.log(`[Storage] Saved file: ${key} (${buffer.length} bytes, ${contentType})`);
  return { key, url };
}

/**
 * Get a file's public URL
 */
export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  const baseUrl = getPublicBaseUrl();
  const url = `${baseUrl}/uploads/${key}`;
  return { key, url };
}

/**
 * Delete a file from local storage
 */
export async function storageDelete(relKey: string): Promise<boolean> {
  try {
    const uploadDir = getUploadDir();
    const key = normalizeKey(relKey);
    const fullPath = path.join(uploadDir, key);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`[Storage] Deleted file: ${key}`);
      return true;
    }
    return false;
  } catch (error) {
    console.error("[Storage] Delete error:", error);
    return false;
  }
}

/**
 * Check if a file exists in local storage
 */
export async function storageExists(relKey: string): Promise<boolean> {
  const uploadDir = getUploadDir();
  const key = normalizeKey(relKey);
  const fullPath = path.join(uploadDir, key);
  return fs.existsSync(fullPath);
}

/**
 * Generate a unique filename
 */
export function generateUniqueKey(prefix: string, extension: string): string {
  const timestamp = Date.now();
  const random = crypto.randomBytes(8).toString("hex");
  return `${prefix}/${timestamp}-${random}.${extension.replace(/^\./, "")}`;
}
