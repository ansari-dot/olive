import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "confirmed",
  "cold_packed",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export const PAYMENT_STATUSES = [
  "pending_cod",
  "awaiting_ibft",
  "paid",
  "refunded",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    slug: { type: String, default: "" },
    name: { type: String, required: true },
    size: { type: String, default: "" },
    image: { type: String, default: "" },
    price: { type: Number, required: true },
    originalPrice: { type: Number },
    isDeal: { type: Boolean, default: false },
    dealId: { type: mongoose.Schema.Types.ObjectId, ref: "Deal" },
    discountPercent: { type: Number, default: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    stage: { type: Number, enum: [0, 1, 2, 3, 4], required: true },
    orderStatus: { type: String, required: true },
    note: { type: String, default: "" },
    updatedBy: { type: String, default: "System" },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      required: [true, "Order reference is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    courierName: {
      type: String,
      default: "TCS Express",
      trim: true,
    },
    courierTrackingCode: {
      type: String,
      default: "",
      trim: true,
    },
    customer: {
      name: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      email: { type: String, default: "", trim: true, lowercase: true },
    },
    shippingAddress: {
      city: { type: String, required: true, trim: true },
      area: { type: String, default: "", trim: true },
      address: { type: String, required: true, trim: true },
      notes: { type: String, default: "", trim: true },
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val) => val.length > 0, "Order must contain at least one item"],
    },
    paymentMethod: {
      type: String,
      enum: ["Cash on Delivery", "Bank Transfer (IBFT)"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending_cod",
    },
    ibftReference: {
      type: String,
      default: null,
      trim: true,
    },
    couponCode: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "cold_packed",
    },
    trackingStage: {
      type: Number,
      enum: [0, 1, 2, 3, 4],
      default: 2,
    },
    statusSummary: {
      type: String,
      default: "Cold-Packed & Sealed — Preparing Parcel at Islamabad Hub",
      trim: true,
    },
    estimatedDelivery: {
      type: String,
      default: "2–3 working days via TCS Express",
      trim: true,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    cancelReason: {
      type: String,
      default: null,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ "customer.phone": 1 });
orderSchema.index({ "customer.email": 1 });
orderSchema.index({ "shippingAddress.city": 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ trackingStage: 1 });
orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
