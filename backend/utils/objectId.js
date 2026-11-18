import mongoose from "mongoose";

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

export function isValidObjectId(id) {
  return typeof id === "string" && OBJECT_ID_RE.test(id);
}

export function toObjectId(id) {
  return new mongoose.Types.ObjectId(id);
}

export default { isValidObjectId, toObjectId };
