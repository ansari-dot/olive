import { handleImageUpload } from "../middlewares/upload.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";

export const uploadMedia = asyncHandler(async (req, res) => {
  let fileBuffer = null;
  let originalName = "upload.jpg";

  if (req.file) {
    fileBuffer = req.file.buffer;
    originalName = req.file.originalname;
  } else if (req.body?.image) {
    const raw = req.body.image;
    if (raw.startsWith("data:image/jpeg") || raw.startsWith("data:image/png") || raw.startsWith("data:image/webp")) {
      const base64Data = raw.replace(/^data:image\/\w+;base64,/, "");
      fileBuffer = Buffer.from(base64Data, "base64");
    } else if (raw.startsWith("data:image/")) {
      throw ApiError.badRequest("Invalid image format: Only JPEG, PNG, and WebP are allowed");
    } else if (raw.startsWith("http://") || raw.startsWith("https://")) {
      return res.json({ success: true, url: raw });
    }
  }

  if (!fileBuffer) {
    throw ApiError.badRequest("No image file or base64 data provided");
  }

  const url = await handleImageUpload(fileBuffer, originalName);

  res.json({
    success: true,
    url,
  });
});
