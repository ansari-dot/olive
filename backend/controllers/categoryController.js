import * as categoryService from "../services/categoryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategories = asyncHandler(async (req, res) => {
  const data = await categoryService.listCategories(req.query);
  res.json(data);
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.json(category);
});

export const createCategory = asyncHandler(async (req, res) => {
  const created = await categoryService.createCategory(req.body);
  res.status(201).json(created);
});

export const updateCategory = asyncHandler(async (req, res) => {
  const updated = await categoryService.updateCategory(req.params.id, req.body);
  res.json(updated);
});

export const deleteCategory = asyncHandler(async (req, res) => {
  const result = await categoryService.deleteCategory(req.params.id);
  res.json(result);
});
