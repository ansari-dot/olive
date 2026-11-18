import mongoose from "mongoose";

const bestSellersSectionSchema = new mongoose.Schema({
    title: { type: String, default: "Best Seller Products" },
    heading: { type: String, default: "Best Seller Products" },
    text: { type: String, default: "" },
    productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
}, { timestamps: true });

export default mongoose.model("BestSellersSection", bestSellersSectionSchema);
