import express from "express";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import path from "path";
import fs from "fs";

import { env } from "./config/env.js";
import { connectDB, syncAllIndexes } from "./config/db.js";
import { bootstrapFirstAdmin } from "./config/bootstrap.js";

import { cache } from "./middlewares/cache.js";
import { logger } from "./middlewares/logger.js";
import { cors } from "./middlewares/cors.js";
import { requestId } from "./middlewares/requestId.js";
import { mongoSanitize } from "./middlewares/mongoSanitize.js";
import { globalLimiter } from "./middlewares/rateLimit.js";
import { errorHandler, notFound } from "./middlewares/errorHandler.js";

import healthRoutes from "./routes/healthRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import contactLeadRoutes from "./routes/contactLeadRoutes.js";
import subscriberRoutes from "./routes/subscriberRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";

// Additional storefront section routes
import testimonialRoutes from "./routes/testimonialRoutes.js";
import homeCollectionRoutes from "./routes/homeCollectionRoutes.js";
import compareSectionRoutes from "./routes/compareSectionRoutes.js";
import popularPicksRoutes from "./routes/popularPicksRoutes.js";
import homeCategoriesRoutes from "./routes/homeCategoriesRoutes.js";
import bestSellersRoutes from "./routes/bestSellersRoutes.js";
import dealSectionRoutes from "./routes/dealSectionRoutes.js";
import heroBannerRoutes from "./routes/heroBannerRoutes.js";
import categorySectionRoutes from "./routes/categorySectionRoutes.js";
import homeRoutes from "./routes/homeRoutes.js";
import instagramRoutes from "./routes/instagramRoutes.js";
import payfastRoutes from "./routes/payfastRoutes.js";
import consultationRoutes from "./routes/consultationRoutes.js";
import aboutTeamRoutes from "./routes/aboutTeamRoutes.js";
import originRoutes from "./routes/originRoutes.js";

const app = express();

if (env.TRUST_PROXY || env.IS_PROD) app.set("trust proxy", 1);

// Order matters: requestId → logger → security → cors → parsers → sanitize → cookies → rate limit → routes.
app.use(requestId);
app.use(logger);
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(cors);
app.use(express.json({ limit: env.REQUEST_BODY_LIMIT || "100kb" }));
app.use(express.urlencoded({ extended: false, limit: env.REQUEST_BODY_LIMIT || "100kb" }));
app.use(mongoSanitize);
app.use(cookieParser());

// Static uploads serving (ensures uploads are served regardless of working directory)
const rootUploads = path.resolve(process.cwd(), "uploads");
const backendUploads = path.resolve(process.cwd(), "backend/uploads");
if (fs.existsSync(rootUploads)) {
  app.use("/uploads", express.static(rootUploads));
}
if (fs.existsSync(backendUploads)) {
  app.use("/uploads", express.static(backendUploads));
}

// Static assets serving (storefront images fallback)
const assetsDir = path.resolve(process.cwd(), "../frontend/public/assets");
const directAssetsDir = path.resolve(process.cwd(), "frontend/public/assets");
if (fs.existsSync(assetsDir)) {
  app.use("/assets", express.static(assetsDir));
} else if (fs.existsSync(directAssetsDir)) {
  app.use("/assets", express.static(directAssetsDir));
}

app.use("/api", globalLimiter);

await connectDB();
await syncAllIndexes();
await bootstrapFirstAdmin();

// Health
app.use("/api/health", healthRoutes);

// Auth (Admin login/me)
app.use("/api/auth", authRoutes);

// Admin Portal - Full admin endpoints (JWT protected)
app.use("/api/admin", adminRoutes);
app.use("/api/admins", adminRoutes); // compatibility alias

// Public Storefront Routes (Guest-friendly, NO signup required)
app.use("/api/products", cache(120), productRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/promo", couponRoutes); // alias
app.use("/api/orders", orderRoutes);
app.use("/api/blogs", cache(300), blogRoutes);
app.use("/api/contact", contactLeadRoutes);
app.use("/api/contacts", contactLeadRoutes); // alias
app.use("/api/newsletter", subscriberRoutes);
app.use("/api/subscribers", subscriberRoutes); // alias

// Compatible storefront sections & dashboard
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/categories", cache(300), categoryRoutes);
app.use("/api/origins", originRoutes);
app.use("/api/testimonials", cache(300), testimonialRoutes);
app.use("/api/home-collection", cache(120), homeCollectionRoutes);
app.use("/api/compare-section", cache(120), compareSectionRoutes);
app.use("/api/popular-picks", cache(120), popularPicksRoutes);
app.use("/api/best-sellers", cache(120), bestSellersRoutes);
app.use("/api/home-categories", cache(300), homeCategoriesRoutes);
app.use("/api/deal-section", cache(120), dealSectionRoutes);
app.use("/api/hero-banner", cache(300), heroBannerRoutes);
app.use("/api/category-sections", cache(300), categorySectionRoutes);
app.use("/api/home", cache(120), homeRoutes);
app.use("/api/instagram-posts", instagramRoutes);
app.use("/api/payments/payfast", payfastRoutes);
app.use("/api/consultations", consultationRoutes);
app.use("/api/about-team", cache(300), aboutTeamRoutes);

// 404 + central error handler
app.use(notFound);
app.use(errorHandler);

export default app;
