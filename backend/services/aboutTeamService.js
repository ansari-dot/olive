import AboutTeam from "../models/AboutTeam.js";
import { createSingletonSectionService } from "./singletonSectionService.js";

const svc = createSingletonSectionService(AboutTeam, {
  cachePrefix: "/api/about-team",
});

export const getAboutTeam = svc.get;
export const upsertAboutTeam = svc.upsert;
