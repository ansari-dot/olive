import mongoose from "mongoose";

const dealSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "Limited Offer" },
    heading: { type: String, default: "Grab the Deal" },
    text: { type: String, default: "" },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
        dealQuantity: { type: Number, required: true, min: 0 },
      },
    ],
    discountType: {
      type: String,
      enum: ["percent", "amount", "none"],
      default: "percent",
    },
    discountValue: { type: Number, default: 0, min: 0 },
    endsAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export default mongoose.model("DealSection", dealSectionSchema);
