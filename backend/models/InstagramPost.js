import mongoose from "mongoose";

const instagramPostSchema = new mongoose.Schema(
  {
    image: { type: String, required: true },
    title: { type: String, default: "" },
    href: { type: String, default: "" },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Listing sort: `order asc, createdAt desc`. The compound matches.
instagramPostSchema.index({ order: 1, createdAt: -1 });

export default mongoose.model("InstagramPost", instagramPostSchema);
