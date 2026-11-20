import mongoose from "mongoose";

const originSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Origin name is required"],
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
    },
    region: {
      type: String,
      default: "Pakistan",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    count: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

originSchema.index({ slug: 1 });
originSchema.index({ createdAt: -1 });

export default mongoose.models.Origin || mongoose.model("Origin", originSchema);
