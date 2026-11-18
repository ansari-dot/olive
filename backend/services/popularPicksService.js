import PopularPicks from "../models/PopularPicks.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(PopularPicks, {
  cachePrefix: "/api/popular-picks",
});

export const getPopularPicks = svc.get;
export const upsertPopularPicks = svc.upsert;
