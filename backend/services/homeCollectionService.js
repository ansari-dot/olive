import HomeCollection from "../models/HomeCollection.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(HomeCollection, {
  cachePrefix: "/api/home-collection",
});

export const getHomeCollection = svc.get;
export const upsertHomeCollection = svc.upsert;
