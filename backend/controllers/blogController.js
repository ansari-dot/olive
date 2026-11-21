import * as blogService from "../services/blogService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Public: GET /api/blogs
export const getPublishedBlogs = asyncHandler(async (_req, res) => {
  const blogs = await blogService.getPublishedBlogs();
  return ApiResponse.success(res, { blogs, data: blogs });
});

// Public: GET /api/blogs/:idOrSlug
export const getBlogByIdOrSlug = asyncHandler(async (req, res) => {
  const blog = await blogService.getBlogByIdOrSlug(req.params.idOrSlug);
  return ApiResponse.success(res, { blog, data: blog });
});

// Public: GET /api/blogs/:idOrSlug/comments
export const getBlogComments = asyncHandler(async (req, res) => {
  const comments = await blogService.getBlogComments(req.params.idOrSlug);
  return ApiResponse.success(res, { comments, data: comments });
});

// Public: POST /api/blogs/:idOrSlug/comments
export const addBlogComment = asyncHandler(async (req, res) => {
  const blog = await blogService.addBlogComment(req.params.idOrSlug, req.body);
  return ApiResponse.created(res, { comments: blog.comments, blog }, "Reader note published successfully");
});

// Admin: GET /api/admin/blogs
export const getAdminBlogs = asyncHandler(async (_req, res) => {
  const blogs = await blogService.getAdminBlogs();
  return ApiResponse.success(res, { blogs, data: blogs });
});

// Admin: POST /api/admin/blogs
export const createBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.createBlog(req.body);
  return ApiResponse.created(res, { blog, data: blog });
});

// Admin: PUT /api/admin/blogs/:id
export const updateBlog = asyncHandler(async (req, res) => {
  const blog = await blogService.updateBlog(req.params.id, req.body);
  return ApiResponse.success(res, { blog, data: blog });
});

// Admin: DELETE /api/admin/blogs/:id
export const deleteBlog = asyncHandler(async (req, res) => {
  await blogService.deleteBlog(req.params.id);
  return ApiResponse.success(res, {}, "Blog post deleted successfully");
});

// Admin: DELETE /api/admin/blogs/:id/comments/:commentId
export const deleteBlogComment = asyncHandler(async (req, res) => {
  const comments = await blogService.deleteBlogComment(req.params.id, req.params.commentId);
  return ApiResponse.success(res, { comments }, "Reader note removed successfully");
});
