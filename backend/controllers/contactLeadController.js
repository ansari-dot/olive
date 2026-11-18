import * as contactLeadService from "../services/contactLeadService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getContactLeads = asyncHandler(async (req, res) => {
  const data = await contactLeadService.listContactLeads(req.query);
  res.json(data);
});

export const createContactLead = asyncHandler(async (req, res) => {
  const created = await contactLeadService.createContactLead(req.body);
  res.status(201).json(created);
});
