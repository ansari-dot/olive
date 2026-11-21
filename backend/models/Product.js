import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Product slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    sku: {
      type: String,
      required: [true, "Product SKU is required"],
      unique: true,
      uppercase: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, "Product brand is required"],
      trim: true,
    },
    category: {
      type: String,
      required: [true, "Product category is required"],
      trim: true,
    },
    subcategory: {
      type: String,
      default: "",
      trim: true,
    },
    flavour: {
      type: String,
      default: null,
      trim: true,
    },
    origin: {
      type: String,
      default: null,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Product price (in PKR) is required"],
      min: [0, "Price must be positive"],
    },
    originalPrice: {
      type: Number,
      default: null,
    },
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    stock: {
      type: Number,
      default: 36,
      min: [0, "Stock cannot be negative"],
    },
    soldCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isSale: {
      type: Boolean,
      default: false,
    },
    isNew: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    popularity: {
      type: Number,
      default: 80,
    },
    size: {
      type: String,
      required: [true, "Product size is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Product image is required"],
      trim: true,
    },
    galleryImages: {
      type: [String],
      default: [],
    },
    tag: {
      type: String,
      default: null,
      trim: true,
    },
    sections: {
      type: [String],
      enum: ["featured-grid", "best-sellers", "unique", "shop"],
      default: ["shop"],
    },
    sectionOrder: {
      "featured-grid": { type: Number, default: 0 },
      "best-sellers": { type: Number, default: 0 },
      unique: { type: Number, default: 0 },
      shop: { type: Number, default: 0 },
    },
    extractionMethod: {
      type: String,
      default: "First Cold-Press (< 27°C), Unfiltered",
      trim: true,
    },
    acidityLevel: {
      type: String,
      default: "< 0.3% Free Fatty Acidity",
      trim: true,
    },
    detailedDescription: {
      type: String,
      default: "",
      trim: true,
    },
    ingredients: {
      type: String,
      default: "",
      trim: true,
    },
    harvestDate: {
      type: String,
      default: "",
      trim: true,
    },
    storageInstructions: {
      type: String,
      default: "",
      trim: true,
    },
    isOrganic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    suppressReservedKeysWarning: true,
  }
);

productSchema.virtual("inStock").get(function () {
  return (this.stock || 0) > 0;
});

productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ sections: 1 });
productSchema.index({ sections: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ popularity: -1 });
productSchema.index({ rating: -1 });
productSchema.index({ isActive: 1 });
productSchema.index({ name: "text", description: "text", category: "text", subcategory: "text" });

const Product = mongoose.models.Product || mongoose.model("Product", productSchema);

export { Product };
export default Product;
