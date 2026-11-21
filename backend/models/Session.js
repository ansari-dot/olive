import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    sessionHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ["super_admin", "hub_manager"],
      default: "super_admin",
    },
    ipAddress: {
      type: String,
      default: "",
      trim: true,
    },
    userAgent: {
      type: String,
      default: "",
      trim: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    revokedReason: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// TTL index for automatic deletion of expired sessions by MongoDB
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Compound index for session lookup and authorization
sessionSchema.index({ sessionHash: 1, isRevoked: 1 });
sessionSchema.index({ adminId: 1, isRevoked: 1 });

const Session = mongoose.models.Session || mongoose.model("Session", sessionSchema);

export default Session;
