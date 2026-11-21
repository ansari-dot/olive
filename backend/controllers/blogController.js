import mongoose from "mongoose";
import BlogPost from "../models/BlogPost.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

// Public: GET /api/blogs
export const getPublishedBlogs = asyncHandler(async (_req, res) => {
  const blogs = await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 });
  res.json({ success: true, blogs, data: blogs });
});

// Public: GET /api/blogs/:idOrSlug
export const getBlogByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const query = {};
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    query.$or = [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }];
  } else {
    query.slug = idOrSlug.toLowerCase();
  }

  const blog = await BlogPost.findOne(query);
  if (!blog) {
    throw ApiError.notFound(`Blog post "${idOrSlug}" not found`);
  }
  res.json({ success: true, blog, data: blog });
});

// Public: POST /api/blogs/:idOrSlug/comments
export const addBlogComment = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const { author, city, comment } = req.body;
  if (!author || !comment) {
    throw ApiError.badRequest("Name and comment are required");
  }

  const query = {};
  if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
    query.$or = [{ _id: idOrSlug }, { slug: idOrSlug.toLowerCase() }];
  } else {
    query.slug = idOrSlug.toLowerCase();
  }

  const blog = await BlogPost.findOne(query);
  if (!blog) {
    throw ApiError.notFound(`Blog post "${idOrSlug}" not found`);
  }

  blog.comments = blog.comments || [];
  blog.comments.unshift({
    author: String(author).trim(),
    city: String(city || "Pakistan").trim(),
    comment: String(comment).trim(),
    createdAt: new Date(),
  });

  await blog.save();
  invalidateCache("/api/blogs");

  res.status(201).json({
    success: true,
    message: "Reader note published successfully",
    comments: blog.comments,
    blog,
  });
});

// Admin: GET /api/admin/blogs
export const getAdminBlogs = asyncHandler(async (_req, res) => {
  const blogs = await BlogPost.find().sort({ createdAt: -1 });
  res.json({ success: true, blogs, data: blogs });
});

const ALLOWED_BLOG_FIELDS = [
  "title",
  "slug",
  "day",
  "month",
  "year",
  "author",
  "category",
  "tags",
  "takeaways",
  "excerpt",
  "readTime",
  "image",
  "alt",
  "content",
  "comments",
  "isPublished",
];

function pickBlogPayload(body) {
  const payload = {};
  for (const field of ALLOWED_BLOG_FIELDS) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  // Sanitize tags
  if (typeof payload.tags === "string") {
    payload.tags = payload.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
  }

  // Sanitize takeaways
  if (typeof payload.takeaways === "string") {
    payload.takeaways = payload.takeaways
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter(Boolean);
  }

  return payload;
}

// Admin: POST /api/admin/blogs
export const createBlog = asyncHandler(async (req, res) => {
  const payload = pickBlogPayload(req.body);
  if (!payload.title || !payload.content) {
    throw ApiError.badRequest("Title and content are required");
  }
  if (!payload.slug) {
    payload.slug = payload.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
  }
  const blog = await BlogPost.create(payload);
  invalidateCache("/api/blogs");
  res.status(201).json({ success: true, blog, data: blog });
});

// Admin: PUT /api/admin/blogs/:id
export const updateBlog = asyncHandler(async (req, res) => {
  const payload = pickBlogPayload(req.body);
  const blog = await BlogPost.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });
  if (!blog) throw ApiError.notFound("Blog post not found");
  invalidateCache("/api/blogs");
  res.json({ success: true, blog, data: blog });
});

// Admin: DELETE /api/admin/blogs/:id
export const deleteBlog = asyncHandler(async (req, res) => {
  const blog = await BlogPost.findByIdAndDelete(req.params.id);
  if (!blog) throw ApiError.notFound("Blog post not found");
  invalidateCache("/api/blogs");
  res.json({ success: true, message: "Blog post deleted successfully" });
});
