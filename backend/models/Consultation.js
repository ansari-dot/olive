import mongoose from "mongoose";

const consultationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, required: true, trim: true },
    consultationType: {
      type: String,
      required: true,
      enum: ["curtains", "blinds", "upholstery", "interior", "commercial"],
    },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true },
    projectDetails: { type: String, default: "", trim: true },
    budget: {
      type: String,
      enum: ["", "under-25k", "25k-50k", "50k-100k", "100k-200k", "200k-plus"],
      default: "",
    },
    urgency: {
      type: String,
      enum: ["flexible", "1-month", "2-weeks", "urgent"],
      default: "flexible",
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    submittedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

// Only `createdAt` is used by current queries (paginated list newest-first).
// Removed speculative indexes on email / status / preferredDate — they cost
// write throughput without serving any read path in the app today.
consultationSchema.index({ createdAt: -1 });

export default mongoose.model("Consultation", consultationSchema);
