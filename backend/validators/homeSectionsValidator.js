import { z } from "zod";
import { objectIdSchema } from "./common.js";

const memberSchema = z.object({
  name: z.string().trim().min(1, "Member name is required"),
  role: z.string().trim().min(1, "Member role is required"),
  img: z.string().trim().min(1, "Member image is required"),
  active: z.coerce.boolean().optional(),
});

export const aboutTeamSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    members: z.array(memberSchema).optional(),
  })
  .partial();

export const heroBannerSchema = z
  .object({
    label: z.string().optional(),
    titleLine1: z.string().optional(),
    titleLine2: z.string().optional(),
    text: z.string().optional(),
    highlights: z.string().optional(),
    primaryBtnText: z.string().optional(),
    primaryBtnLink: z.string().optional(),
    secondaryBtnText: z.string().optional(),
    secondaryBtnLink: z.string().optional(),
    offerChip: z.string().optional(),
    heroImages: z.array(z.string()).optional(),
  })
  .partial();

export const homeCollectionSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    productIds: z.array(objectIdSchema).optional(),
  })
  .partial();

export const homeCategoriesSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    categoryIds: z.array(objectIdSchema).optional(),
  })
  .partial();

export const popularPicksSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    productIds: z.array(objectIdSchema).optional(),
  })
  .partial();

export const bestSellersSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    productIds: z.array(objectIdSchema).optional(),
  })
  .partial();

export const compareSectionSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    productIds: z.array(objectIdSchema).optional(),
  })
  .partial();

export const dealSectionSchema = z
  .object({
    title: z.string().optional(),
    heading: z.string().optional(),
    text: z.string().optional(),
    products: z.array(
      z.object({
        productId: objectIdSchema,
        dealQuantity: z.coerce.number().nonnegative(),
      })
    ).optional(),
    discountType: z.enum(["percent", "amount", "none"]).optional(),
    discountValue: z.coerce.number().nonnegative().optional(),
    endsAt: z.coerce.date().nullable().optional(),
  })
  .partial();

const baseCategorySectionBody = z.object({
  title: z.string().optional(),
  heading: z.string().optional(),
  text: z.string().optional(),
  categoryIds: z.array(objectIdSchema).optional(),
  productIds: z.array(objectIdSchema).optional(),
  position: z.coerce.number().int().optional(),
  active: z.coerce.boolean().optional(),
});
export const createCategorySectionSchema = baseCategorySectionBody;
export const updateCategorySectionSchema = baseCategorySectionBody.partial();

export const categorySectionIdParamSchema = z.object({ id: objectIdSchema });
