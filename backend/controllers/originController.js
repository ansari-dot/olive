import * as originService from "../services/originService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getOrigins = asyncHandler(async (_req, res) => {
  const origins = await originService.listOrigins();
  res.json({ success: true, origins, data: origins });
});

export const getOriginById = asyncHandler(async (req, res) => {
  const origin = await originService.getOriginById(req.params.id);
  res.json({ success: true, origin, data: origin });
});

export const createOrigin = asyncHandler(async (req, res) => {
  const created = await originService.createOrigin(req.body);
  res.status(201).json({ success: true, origin: created, data: created });
});

export const updateOrigin = asyncHandler(async (req, res) => {
  const updated = await originService.updateOrigin(req.params.id, req.body);
  res.json({ success: true, origin: updated, data: updated });
});

export const deleteOrigin = asyncHandler(async (req, res) => {
  const result = await originService.deleteOrigin(req.params.id);
  res.json({ success: true, ...result });
});
