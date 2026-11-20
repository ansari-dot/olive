import { z } from "zod";
import { objectIdSchema } from "./common.js";

const subcategorySchema = z.object({
  name: z.string().trim().min(1, "Subcategory name is required"),
  slug: z.string().optional().default(""),
  serialNumber: z.string().optional().default(""),
  count: z.coerce.number().int().nonnegative().optional(),
  description: z.string().optional().default(""),
});

const baseCategoryBody = z.object({
  categoryNumber: z.coerce.number().int().positive().optional(),
  name: z.string().trim().min(1, "Name is required"),
  slug: z.string().optional(),
  department: z.string().optional(),
  description: z.string().optional(),
  count: z.coerce.number().int().nonnegative().optional(),
  img: z.string().optional(),
  icon: z.string().optional(),
  subcategories: z.array(subcategorySchema).optional(),
});

export const createCategorySchema = baseCategoryBody;
export const updateCategorySchema = baseCategoryBody.partial();

export const categoryListQuerySchema = z.object({
  ids: z.string().optional(),
  department: z.string().optional(),
});

export const categoryIdParamSchema = z.object({ id: objectIdSchema });
