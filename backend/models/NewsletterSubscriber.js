import mongoose from "mongoose";

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Subscriber email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    source: {
      type: String,
      default: "Harvest Letter",
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    subscribedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

newsletterSubscriberSchema.index({ isActive: 1 });

const NewsletterSubscriber =
  mongoose.models.NewsletterSubscriber ||
  mongoose.model("NewsletterSubscriber", newsletterSubscriberSchema);

export default NewsletterSubscriber;
