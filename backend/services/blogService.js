import mongoose from "mongoose";
import BlogPost from "../models/BlogPost.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

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
  "isPopular",
  "isPublished",
];

function sanitizeBlogPayload(body) {
  const payload = {};
  for (const field of ALLOWED_BLOG_FIELDS) {
    if (body[field] !== undefined) {
      payload[field] = body[field];
    }
  }

  if (payload.isPopular !== undefined) {
    payload.isPopular = Boolean(payload.isPopular);
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

export async function getPublishedBlogs() {
  return await BlogPost.find({ isPublished: true }).sort({ createdAt: -1 });
}

export async function getBlogByIdOrSlug(idOrSlug) {
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
  return blog;
}

export async function getBlogComments(idOrSlug) {
  const blog = await getBlogByIdOrSlug(idOrSlug);
  return blog.comments || [];
}

export async function addBlogComment(idOrSlug, { author, city, comment }) {
  if (!author || !comment) {
    throw ApiError.badRequest("Name and comment are required");
  }

  const blog = await getBlogByIdOrSlug(idOrSlug);
  blog.comments = blog.comments || [];
  blog.comments.unshift({
    author: String(author).trim(),
    city: String(city || "Pakistan").trim(),
    comment: String(comment).trim(),
    createdAt: new Date(),
  });

  await blog.save();
  invalidateCache("/api/blogs");
  return blog;
}

export async function getAdminBlogs() {
  return await BlogPost.find().sort({ createdAt: -1 });
}

export async function createBlog(body) {
  const payload = sanitizeBlogPayload(body);
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
  return blog;
}

export async function updateBlog(id, body) {
  const payload = sanitizeBlogPayload(body);
  const blog = await BlogPost.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
  if (!blog) throw ApiError.notFound("Blog post not found");
  invalidateCache("/api/blogs");
  return blog;
}

export async function deleteBlog(id) {
  const blog = await BlogPost.findByIdAndDelete(id);
  if (!blog) throw ApiError.notFound("Blog post not found");
  invalidateCache("/api/blogs");
  return blog;
}

export async function deleteBlogComment(id, commentId) {
  const blog = await BlogPost.findById(id);
  if (!blog) throw ApiError.notFound("Blog post not found");

  const initialCount = blog.comments ? blog.comments.length : 0;
  blog.comments = (blog.comments || []).filter(
    (c) => c._id.toString() !== commentId && c.id !== commentId
  );

  if (blog.comments.length === initialCount) {
    throw ApiError.notFound("Comment not found on this blog post");
  }

  await blog.save();
  invalidateCache("/api/blogs");
  return blog.comments;
}
