import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env.js";

cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
});

const BASE64_RE = /^data:image\/[a-zA-Z0-9+.-]+;base64,/;

const cloudinaryReady =
  env.CLOUDINARY.CLOUD_NAME &&
  env.CLOUDINARY.API_KEY &&
  env.CLOUDINARY.API_SECRET;

/**
 * Upload a single image to Cloudinary. Accepts a base64 data URL or an
 * existing https:// URL (returned as-is). Returns the secure Cloudinary URL.
 * If Cloudinary is not configured or upload fails, returns empty string so
 * MongoDB never stores a raw base64 blob.
 */
export async function uploadImage(src, folder) {
  if (!src || typeof src !== "string") return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (!BASE64_RE.test(src)) return src;

  if (!cloudinaryReady) {
    console.warn("[cloudinary] credentials not configured — image dropped");
    return "";
  }

  try {
    const result = await cloudinary.uploader.upload(src, {
      folder: folder || env.CLOUDINARY.PRODUCT_FOLDER,
      resource_type: "image",
    });
    return result.secure_url;
  } catch (err) {
    console.error("[cloudinary] upload failed:", err?.error?.message || err?.message || err);
    throw new Error(
      `Image upload failed: ${
        err?.error?.message || err?.message || "Cloudinary error"
      }. Please check your Cloudinary credentials in .env.`
    );
  }
}

/**
 * Upload all image fields in a product payload (img + colors[].image).
 * Returns a new payload object with base64 strings replaced by Cloudinary URLs.
 */
export async function uploadProductImages(payload) {
  const folder = env.CLOUDINARY.PRODUCT_FOLDER;
  const out = { ...payload };

  if (out.img) {
    out.img = await uploadImage(out.img, folder);
  }

  if (Array.isArray(out.colors) && out.colors.length) {
    out.colors = await Promise.all(
      out.colors.map(async (c) => ({
        ...c,
        image: c.image ? await uploadImage(c.image, folder) : "",
      }))
    );
  }

  return out;
}
