import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AdminUser",
      default: null,
      index: true,
    },
    adminName: {
      type: String,
      default: "System",
      trim: true,
    },
    adminEmail: {
      type: String,
      default: "",
      trim: true,
    },
    adminRole: {
      type: String,
      default: "super_admin",
      trim: true,
    },
    action: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    targetResource: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    targetId: {
      type: String,
      default: "",
      index: true,
      trim: true,
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
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// High-speed compound queries for audit investigations
auditLogSchema.index({ targetResource: 1, targetId: 1, timestamp: -1 });
auditLogSchema.index({ adminId: 1, timestamp: -1 });
auditLogSchema.index({ timestamp: -1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
