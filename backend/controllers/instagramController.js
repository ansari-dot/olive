import * as instagramService from "../services/instagramService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAll = asyncHandler(async (_req, res) => {
  const posts = await instagramService.listInstagramPosts();
  res.json(posts);
});

export const create = asyncHandler(async (req, res) => {
  const post = await instagramService.createInstagramPost(req.body);
  res.status(201).json(post);
});

export const update = asyncHandler(async (req, res) => {
  const post = await instagramService.updateInstagramPost(
    req.params.id,
    req.body
  );
  res.json(post);
});

export const remove = asyncHandler(async (req, res) => {
  const result = await instagramService.deleteInstagramPost(req.params.id);
  res.json(result);
});
