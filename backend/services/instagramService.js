import InstagramPost from "../models/InstagramPost.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";

function bust() {
  invalidateCache("/api/instagram-posts");
}

export async function listInstagramPosts() {
  return InstagramPost.find().sort({ order: 1, createdAt: -1 });
}

export async function createInstagramPost(body) {
  const post = await InstagramPost.create(body);
  bust();
  return post.toObject();
}

export async function updateInstagramPost(id, body) {
  const post = await InstagramPost.findByIdAndUpdate(id, body, { new: true });
  if (!post) throw ApiError.notFound("Not found");
  bust();
  return post.toObject();
}

export async function deleteInstagramPost(id) {
  const post = await InstagramPost.findByIdAndDelete(id);
  if (!post) throw ApiError.notFound("Not found");
  bust();
  return { message: "Deleted" };
}
