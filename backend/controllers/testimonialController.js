import * as testimonialService from "../services/testimonialService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getTestimonials = asyncHandler(async (req, res) => {
  const data = await testimonialService.listTestimonials(req.query);
  res.json(data);
});

export const getTestimonialById = asyncHandler(async (req, res) => {
  const item = await testimonialService.getTestimonialById(req.params.id);
  res.json(item);
});

export const createTestimonial = asyncHandler(async (req, res) => {
  const created = await testimonialService.createTestimonial(req.body);
  res.status(201).json(created);
});

export const updateTestimonial = asyncHandler(async (req, res) => {
  const updated = await testimonialService.updateTestimonial(
    req.params.id,
    req.body
  );
  res.json(updated);
});

export const deleteTestimonial = asyncHandler(async (req, res) => {
  const result = await testimonialService.deleteTestimonial(req.params.id);
  res.json(result);
});
