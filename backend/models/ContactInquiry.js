import mongoose from "mongoose";

const contactInquirySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Inquirer name is required"],
      trim: true,
    },
    contactInfo: {
      type: String,
      required: [true, "Contact info (email or phone) is required"],
      trim: true,
    },
    city: {
      type: String,
      default: "Islamabad",
      trim: true,
    },
    topic: {
      type: String,
      enum: [
        "Order & Cash on Delivery",
        "Product Harvest & Lab Purity",
        "Bulk & Corporate Gifting",
        "Orchard & Wholesale Partnership",
      ],
      required: [true, "Inquiry topic is required"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "in_progress", "resolved"],
      default: "new",
    },
    adminNote: {
      type: String,
      default: "",
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

contactInquirySchema.index({ status: 1 });
contactInquirySchema.index({ createdAt: -1 });

const ContactInquiry =
  mongoose.models.ContactInquiry ||
  mongoose.model("ContactInquiry", contactInquirySchema);

export default ContactInquiry;
