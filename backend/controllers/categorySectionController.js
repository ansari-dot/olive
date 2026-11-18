import * as categorySectionService from "../services/categorySectionService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getCategorySections = asyncHandler(async (_req, res) => {
  const docs = await categorySectionService.listCategorySections();
  res.json(docs);
});

export const createCategorySection = asyncHandler(async (req, res) => {
  const doc = await categorySectionService.createCategorySection(req.body);
  res.status(201).json(doc);
});

export const updateCategorySection = asyncHandler(async (req, res) => {
  const doc = await categorySectionService.updateCategorySection(
    req.params.id,
    req.body
  );
  res.json(doc);
});

export const deleteCategorySection = asyncHandler(async (req, res) => {
  const result = await categorySectionService.deleteCategorySection(
    req.params.id
  );
  res.json(result);
});
