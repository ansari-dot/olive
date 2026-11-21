import mongoose from "mongoose";

const blogCommentSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: [true, "Comment author is required"],
      trim: true,
    },
    city: {
      type: String,
      trim: true,
      default: "Pakistan",
    },
    comment: {
      type: String,
      required: [true, "Comment body is required"],
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

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
    year: {
      type: String,
      trim: true,
      default: "2026",
    },
    author: {
      type: String,
      trim: true,
      default: "Pak Veda",
    },
    category: {
      type: String,
      trim: true,
      default: "Harvest & Extraction",
    },
    tags: {
      type: [String],
      default: [],
    },
    takeaways: {
      type: [String],
      default: [],
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
    comments: {
      type: [blogCommentSchema],
      default: [],
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
blogPostSchema.index({ category: 1 });
blogPostSchema.index({ tags: 1 });

const BlogPost = mongoose.models.BlogPost || mongoose.model("BlogPost", blogPostSchema);

export default BlogPost;
