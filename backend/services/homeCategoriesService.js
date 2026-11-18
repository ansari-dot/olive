import HomeCategories from "../models/HomeCategories.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(HomeCategories, {
  cachePrefix: "/api/home-categories",
});

export const getHomeCategories = svc.get;
export const upsertHomeCategories = svc.upsert;
