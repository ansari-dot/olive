import mongoose from "mongoose";

const dealSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product is required for a deal"],
      index: true,
    },
    title: {
      type: String,
      default: "Flash Deal",
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["percent", "fixed_price"],
      default: "percent",
    },
    discountValue: {
      type: Number,
      required: [true, "Discount value is required"],
      min: [0, "Discount value cannot be negative"],
    },
    originalPrice: {
      type: Number,
      required: [true, "Original product price is required"],
      min: [0, "Price cannot be negative"],
    },
    dealPrice: {
      type: Number,
      required: [true, "Deal price is required"],
      min: [0, "Price cannot be negative"],
    },
    discountPercent: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [1, "Discount percentage must be at least 1%"],
      max: [99, "Discount percentage cannot exceed 99%"],
    },
    dealBadge: {
      type: String,
      default: "",
      trim: true,
    },
    startsAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    endsAt: {
      type: Date,
      required: [true, "Deal end date and time are required"],
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    dealStockLimit: {
      type: Number,
      default: 0, // 0 = unlimited during the deal timeframe
      min: [0, "Deal stock limit cannot be negative"],
    },
    dealSoldCount: {
      type: Number,
      default: 0,
      min: [0, "Sold count cannot be negative"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

/**
 * Computes dynamic status: 'active', 'scheduled', 'expired', 'disabled', or 'sold_out'
 */
dealSchema.virtual("status").get(function () {
  if (!this.isActive) return "disabled";
  const now = new Date();
  if (this.dealStockLimit > 0 && this.dealSoldCount >= this.dealStockLimit) {
    return "sold_out";
  }
  if (now < this.startsAt) return "scheduled";
  if (now > this.endsAt) return "expired";
  return "active";
});

// Composite index to swiftly query active running deals
dealSchema.index({ product: 1, isActive: 1, startsAt: 1, endsAt: 1 });

export default mongoose.models.Deal || mongoose.model("Deal", dealSchema);
