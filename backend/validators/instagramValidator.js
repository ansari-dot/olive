import { z } from "zod";
import { objectIdSchema } from "./common.js";

const baseInstagramBody = z.object({
  image: z.string().trim().min(1, "Image is required"),
  title: z.string().optional(),
  href: z.string().optional(),
  order: z.coerce.number().int().optional(),
});

export const createInstagramSchema = baseInstagramBody;
export const updateInstagramSchema = baseInstagramBody.partial();
export const instagramIdParamSchema = z.object({ id: objectIdSchema });
