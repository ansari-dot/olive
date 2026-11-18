import * as consultationService from "../services/consultationService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getConsultations = asyncHandler(async (req, res) => {
  const data = await consultationService.listConsultations(req.query);
  res.json(data);
});

export const createConsultation = asyncHandler(async (req, res) => {
  const created = await consultationService.createConsultation(req.body);
  res.status(201).json(created);
});

export const updateConsultationStatus = asyncHandler(async (req, res) => {
  const updated = await consultationService.updateConsultationStatus(
    req.params.id,
    req.body
  );
  res.json(updated);
});
