import * as adminService from "../services/adminService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

export const getAdmins = asyncHandler(async (req, res) => {
  const data = await adminService.listAdmins(req.query);
  res.json(data);
});

export const getAdminById = asyncHandler(async (req, res) => {
  const admin = await adminService.getAdminById(req.params.id);
  res.json(admin);
});

export const createAdmin = asyncHandler(async (req, res) => {
  const created = await adminService.createAdmin(req.body);
  res.status(201).json(created);
});

export const updateAdmin = asyncHandler(async (req, res) => {
  const updated = await adminService.updateAdmin(req.params.id, req.body);
  res.json(updated);
});

export const deleteAdmin = asyncHandler(async (req, res) => {
  const result = await adminService.deleteAdmin(req.params.id, req.auth?.sub);
  res.json(result);
});
