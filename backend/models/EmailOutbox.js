import mongoose from "mongoose";

const emailOutboxSchema = new mongoose.Schema(
  {
    orderReference: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    recipient: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    template: {
      type: String,
      enum: ["order_confirmation", "shipment_dispatched"],
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    status: {
      type: String,
      enum: ["pending", "sent", "failed"],
      default: "pending",
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastError: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

emailOutboxSchema.index({ status: 1, attempts: 1, createdAt: 1 });

const EmailOutbox =
  mongoose.models.EmailOutbox || mongoose.model("EmailOutbox", emailOutboxSchema);

export default EmailOutbox;
