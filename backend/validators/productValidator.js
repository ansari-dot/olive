import { z } from "zod";
import { objectIdSchema } from "./common.js";

const colorSchema = z.object({
  name: z.string().optional().default(""),
  image: z.string().optional().default(""),
  hex: z.string().optional().default(""),
});

const specsSchema = z
  .object({
    Dimensions: z.string().optional(),
    Weight: z.string().optional(),
    Material: z.string().optional(),
    Assembly: z.string().optional(),
    Warranty: z.string().optional(),
  })
  .partial()
  .optional();

const baseProductBody = z.object({
  sku: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required"),
  price: z.coerce.number().nonnegative("Price must be >= 0"),
  priceUnit: z.string().optional(),
  netPrice: z.coerce.number().nonnegative().nullable().optional(),
  polyesterPrice: z.coerce.number().nonnegative().nullable().optional(),
  quantity: z.coerce.number().int().nonnegative().optional(),
  isDeal: z.coerce.boolean().optional(),
  img: z.string().optional(),
  imgs: z.array(z.string()).optional(),
  category: z.string().trim().min(1, "Category is required"),
  subcategory: z.string().optional(),
  material: z.string().trim().min(1, "Material is required"),
  badge: z.string().nullable().optional(),
  sizes: z.array(z.string()).optional(),
  description: z.string().optional(),
  specs: specsSchema,
  inStock: z.coerce.boolean().optional(),
  colors: z.array(colorSchema).optional(),
});

export const createProductSchema = baseProductBody;
export const updateProductSchema = baseProductBody.partial();

export const productListQuerySchema = z.object({
  search: z.string().optional(),
  ids: z.string().optional(),
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(1000).optional(),
  category: z.string().optional(),
});

export const productIdParamSchema = z.object({ id: objectIdSchema });
