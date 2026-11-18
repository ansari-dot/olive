import CompareSection from "../models/CompareSection.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(CompareSection, {
  cachePrefix: "/api/compare-section",
});

export const getCompareSection = svc.get;
export const upsertCompareSection = svc.upsert;
