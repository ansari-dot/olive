import mongoose from "mongoose";

const subcategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, default: "" },
    serialNumber: { type: String, default: "" },
    count: { type: Number, default: 0 },
    description: { type: String, default: "" },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    categoryNumber: { type: Number },
    name: { type: String, required: true, unique: true },
    slug: { type: String, trim: true, lowercase: true },
    department: { type: String, default: "Pantry & Botanicals" },
    description: { type: String, default: "" },
    count: { type: Number, default: 0 },
    img: { type: String, default: "" },
    icon: { type: String, default: "" },
    subcategories: { type: [subcategorySchema], default: [] },
  },
  { timestamps: true }
);

categorySchema.index({ categoryNumber: 1 });
categorySchema.index({ department: 1 });
categorySchema.index({ createdAt: -1 });

export default mongoose.models.Category || mongoose.model("Category", categorySchema);
