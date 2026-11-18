import Consultation from "../models/Consultation.js";
import { ApiError } from "../utils/ApiError.js";
import { invalidateCache } from "../middlewares/cache.js";
import { parsePagination } from "../utils/pagination.js";

export async function listConsultations(query = {}) {
  const { page, limit, skip } = parsePagination(query, { defaultLimit: 20 });
  const [consultations, total] = await Promise.all([
    Consultation.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Consultation.countDocuments(),
  ]);

  return {
    consultations,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}

export async function createConsultation(body) {
  const payload = {
    ...body,
    submittedAt: body.submittedAt || new Date(),
  };
  const created = await Consultation.create(payload);
  invalidateCache("/api/dashboard");
  return created.toObject();
}

export async function updateConsultationStatus(id, { status, notes }) {
  const updated = await Consultation.findByIdAndUpdate(
    id,
    {
      status,
      notes: String(notes || "").trim(),
      updatedAt: new Date(),
    },
    { new: true }
  );
  if (!updated) throw ApiError.notFound("Consultation not found");
  invalidateCache("/api/dashboard");
  return updated.toObject();
}
