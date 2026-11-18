import mongoose from "mongoose";

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    quote: { type: String, required: true },
    img: { type: String, default: "" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Compound covers the homepage query `find({active:true}).sort({createdAt:-1})`
// without needing a second standalone index.
testimonialSchema.index({ active: 1, createdAt: -1 });

export default mongoose.model("Testimonial", testimonialSchema);
