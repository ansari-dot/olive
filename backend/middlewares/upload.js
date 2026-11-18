import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

// Ensure local uploads directory exists
const uploadDir = path.resolve(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Allowed safe image MIME types and extensions (blocking SVG, HTML, JS, etc.)
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

// Multer memory storage
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const mime = (file.mimetype || "").toLowerCase();

    if (!ALLOWED_MIME_TYPES.has(mime) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(
        new Error("Invalid file type: Only JPEG, PNG, and WebP images are allowed (max 5 MB). SVG and non-images are blocked for security.")
      );
    }
    cb(null, true);
  },
});

/**
 * Uploads a buffer or base64 string to Cloudinary or falls back to local uploads directory
 */
export async function handleImageUpload(fileOrBuffer, originalName = "upload.jpg") {
  const isCloudinaryConfigured =
    env.CLOUDINARY.CLOUD_NAME &&
    env.CLOUDINARY.API_KEY &&
    env.CLOUDINARY.API_SECRET;

  if (isCloudinaryConfigured) {
    try {
      return await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: env.CLOUDINARY.PRODUCT_FOLDER || "zaitoon/products",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          }
        );
        stream.end(fileOrBuffer);
      });
    } catch (err) {
      console.warn("[upload] Cloudinary upload failed, falling back to local storage:", err.message);
    }
  }

  // Fallback: save to local uploads directory
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(originalName) || ".jpg"}`;
  const filePath = path.join(uploadDir, filename);
  fs.writeFileSync(filePath, fileOrBuffer);
  return `/uploads/${filename}`;
}

export default upload;
