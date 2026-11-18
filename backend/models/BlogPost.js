import mongoose from "mongoose";

const blogPostSchema = new mongoose.Schema(
  {
    slug: {
      type: String,
      required: [true, "Blog slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
    },
    day: {
      type: String,
      required: [true, "Publication day is required"],
      trim: true,
    },
    month: {
      type: String,
      required: [true, "Publication month is required"],
      trim: true,
    },
    title: {
      type: String,
      required: [true, "Blog title is required"],
      trim: true,
    },
    excerpt: {
      type: String,
      required: [true, "Blog excerpt is required"],
      trim: true,
    },
    readTime: {
      type: String,
      required: [true, "Read time is required"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Blog image is required"],
      trim: true,
    },
    alt: {
      type: String,
      required: [true, "Image alt text is required"],
      trim: true,
    },
    content: {
      type: [String],
      required: [true, "Blog content paragraphs are required"],
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

blogPostSchema.index({ isPublished: 1, createdAt: -1 });

const BlogPost = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;
