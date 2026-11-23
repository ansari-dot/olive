import mongoose from "mongoose";

export const ORDER_STATUSES = [
  "confirmed",
  "cold_packed",
  "dispatched",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
];

export const PAYMENT_STATUSES = [
  "pending_cod",
  "awaiting_ibft",
  "pending_payfast",
  "paid",
  "refunded",
  "failed",
];

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
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

const shipmentAttemptSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "" },
    action: { type: String, default: "createShipment" },
    requestPayload: { type: mongoose.Schema.Types.Mixed, default: null },
    responsePayload: { type: mongoose.Schema.Types.Mixed, default: null },
    error: { type: String, default: null },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const shipmentSchema = new mongoose.Schema(
  {
    provider: { type: String, default: "mock", trim: true },
    trackingNumber: { type: String, default: "", trim: true },
    trackingUrl: { type: String, default: "", trim: true },
    labelUrl: { type: String, default: "", trim: true },
    parcelWeightKg: { type: Number, default: 0.5, min: 0.1 },
    codAmount: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: [
        "unshipped",
        "manifested",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "returned",
        "cancelled",
      ],
      default: "unshipped",
    },
    dispatchedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    shipmentAttempts: {
      type: [shipmentAttemptSchema],
      default: [],
    },
  },
  { _id: false }
);

const returnDetailsSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["none", "requested", "inspected", "approved", "restocked", "rejected"],
      default: "none",
    },
    reason: { type: String, default: "" },
    inspectedBy: { type: String, default: "" },
    inspectedAt: { type: Date, default: null },
    restockedAt: { type: Date, default: null },
    restockedQuantity: { type: Number, default: 0 },
    auditNote: { type: String, default: "" },
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
    idempotencyKey: {
      type: String,
      sparse: true,
      unique: true,
      trim: true,
    },
    inventoryState: {
      type: String,
      enum: ["reserved", "deducted", "restored", "failed"],
      default: "deducted",
      index: true,
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
    shipment: {
      type: shipmentSchema,
      default: () => ({}),
    },
    returnDetails: {
      type: returnDetailsSchema,
      default: () => ({}),
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
      enum: [
        "Cash on Delivery",
        "PayFast (Sandbox)",
        "PayFast",
        "Bank Transfer (IBFT)",
      ],
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
orderSchema.index({ "shipment.trackingNumber": 1 });
orderSchema.index({ "shipment.status": 1 });
orderSchema.index({ "shipment.provider": 1 });
orderSchema.index({ createdAt: -1 });

// High-performance compound indexes for admin searches and reports
orderSchema.index({ orderStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, createdAt: -1 });
orderSchema.index({ "shippingAddress.city": 1, createdAt: -1 });
orderSchema.index({ "shipment.provider": 1, createdAt: -1 });

const Order = mongoose.models.Order || mongoose.model("Order", orderSchema);

export default Order;
