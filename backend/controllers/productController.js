import * as productService from "../services/productService.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Public: GET /api/products
export const getProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, true);
  res.json(result);
});

// Public: GET /api/products/navigation
export const getProductNavigation = asyncHandler(async (_req, res) => {
  const nav = await productService.getProductNavigation();
  res.json(nav);
});

// Public: GET /api/products/filters
export const getProductFilters = asyncHandler(async (_req, res) => {
  const filters = await productService.getProductFilters();
  res.json(filters);
});

// Public: GET /api/products/:idOrSlug
export const getProductByIdOrSlug = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const result = await productService.getProductByIdOrSlug(idOrSlug, true);
  res.json(result);
});

// Public: POST /api/products/:idOrSlug/reviews
export const addReview = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const result = await productService.addProductReview(idOrSlug, req.body);
  res.status(201).json({
    success: true,
    message: "Review added successfully",
    ...result,
  });
});

// Admin: GET /api/admin/products
export const getAdminProducts = asyncHandler(async (req, res) => {
  const result = await productService.listProducts(req.query, false);
  res.json({
    success: true,
    data: result.products,
    ...result,
  });
});

// Admin: POST /api/admin/products
export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json({
    success: true,
    product,
  });
});

// Admin: PUT /api/admin/products/:id
export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.json({
    success: true,
    product,
  });
});

// Admin: PATCH /api/admin/products/:id/stock
export const updateStock = asyncHandler(async (req, res) => {
  const product = await productService.adjustStock(req.params.id, req.body.stock);
  res.json({
    success: true,
    product,
  });
});

// Admin: DELETE /api/admin/products/:id
export const deleteProduct = asyncHandler(async (req, res) => {
  const result = await productService.deleteProduct(req.params.id);
  res.json(result);
});
