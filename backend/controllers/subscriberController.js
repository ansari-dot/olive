import * as subscriberService from "../services/subscriberService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getSubscribers = asyncHandler(async (req, res) => {
  const data = await subscriberService.listSubscribers(req.query);
  res.json(data);
});

export const createSubscriber = asyncHandler(async (req, res) => {
  const { record, isNew } = await subscriberService.subscribe(req.body);
  res.status(isNew ? 201 : 200).json(record);
});
