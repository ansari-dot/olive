import { z } from "zod";
import { objectIdSchema } from "./common.js";

const subcategorySchema = z.object({
  name: z.string().trim().min(1, "Subcategory name is required"),
  serialNumber: z.string().optional().default(""),
});

const baseCategoryBody = z.object({
  name: z.string().trim().min(1, "Name is required"),
  count: z.coerce.number().int().nonnegative().optional(),
  img: z.string().optional(),
  subcategories: z.array(subcategorySchema).optional(),
});

export const createCategorySchema = baseCategoryBody;
export const updateCategorySchema = baseCategoryBody.partial();

export const categoryListQuerySchema = z.object({
  ids: z.string().optional(),
});

export const categoryIdParamSchema = z.object({ id: objectIdSchema });
