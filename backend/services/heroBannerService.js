import HeroBanner from "../models/HeroBanner.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(HeroBanner, {
  cachePrefix: "/api/hero-banner",
});

export const getHeroBanner = svc.get;
export const upsertHeroBanner = svc.upsert;
