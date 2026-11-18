import BestSellersSection from "../models/BestSellersSection.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(BestSellersSection, {
  cachePrefix: "/api/best-sellers",
});

export const getBestSellers = svc.get;
export const upsertBestSellers = svc.upsert;
