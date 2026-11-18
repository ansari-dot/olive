import { Router } from "express";
import { verifyAdmin } from "../middlewares/verifyAdmin.js";
import { upload } from "../middlewares/upload.js";
import { authLimiter } from "../middlewares/rateLimit.js";

// Controllers
import * as authController from "../controllers/authController.js";
import * as dashboardController from "../controllers/dashboardController.js";
import * as productController from "../controllers/productController.js";
import * as couponController from "../controllers/couponController.js";
import * as orderController from "../controllers/orderController.js";
import * as blogController from "../controllers/blogController.js";
import * as reviewController from "../controllers/reviewController.js";
import * as contactInquiryController from "../controllers/contactInquiryController.js";
import * as newsletterController from "../controllers/newsletterController.js";
import * as uploadController from "../controllers/uploadController.js";

const router = Router();

// ====================================================================
// 1. Admin Auth
// ====================================================================
router.post("/auth/login", authLimiter, authController.login);
router.post("/login", authLimiter, authController.login); // alias
router.post("/auth/logout", authController.logout);
router.get("/auth/me", verifyAdmin, authController.me);
router.get("/me", verifyAdmin, authController.me); // alias

// Protect ALL routes below this point with verifyAdmin
router.use(verifyAdmin);

// ====================================================================
// 2. Dashboard Analytics
// ====================================================================
router.get("/dashboard/stats", dashboardController.getStats);
router.get("/dashboard", dashboardController.getStats); // alias

// ====================================================================
// 3. Product & Media Management
// ====================================================================
router.get("/products", productController.getAdminProducts);
router.post("/products", productController.createProduct);
router.put("/products/:id", productController.updateProduct);
router.patch("/products/:id/stock", productController.updateStock);
router.delete("/products/:id", productController.deleteProduct);

// Merchandising Sections
router.get("/sections", productController.getAdminSections);
router.patch("/sections/:sectionKey", productController.updateAdminSectionLayout);

// Upload endpoint
router.post(
  "/upload",
  (req, res, next) => {
    upload.single("image")(req, res, (err) => {
      if (err) {
        if (err.message && err.message.includes("Invalid file type")) {
          return res.status(400).json({ success: false, message: err.message });
        }
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File exceeds 5 MB limit" });
        }
        // Fallback: try "file" field
        upload.single("file")(req, res, (err2) => {
          if (err2) {
            return res.status(400).json({ success: false, message: err2.message });
          }
          next();
        });
      } else {
        next();
      }
    });
  },
  uploadController.uploadMedia
);

// ====================================================================
// 4. Coupon Management
// ====================================================================
router.get("/coupons", couponController.getAdminCoupons);
router.post("/coupons", couponController.createCoupon);
router.put("/coupons/:id", couponController.updateCoupon);
router.patch("/coupons/:id/toggle", couponController.toggleCoupon);
router.delete("/coupons/:id", couponController.deleteCoupon);

// ====================================================================
// 5. Order Actions & Dispatch Lifecycle
// ====================================================================
router.get("/orders", orderController.getAdminOrders);
router.get("/orders/:orderReference", orderController.getAdminOrder);
router.patch("/orders/:orderReference/status", orderController.updateOrderStatus);
router.patch("/orders/:orderReference/tracking", orderController.updateOrderTracking);
router.patch("/orders/:orderReference/payment", orderController.updateOrderPayment);
router.patch("/orders/:orderReference/cancel", orderController.cancelOrder);

// ====================================================================
// 6. Blogs, Reviews, Contact Inquiries & Newsletter Management
// ====================================================================
// Blogs
router.get("/blogs", blogController.getAdminBlogs);
router.post("/blogs", blogController.createBlog);
router.put("/blogs/:id", blogController.updateBlog);
router.delete("/blogs/:id", blogController.deleteBlog);

// Reviews
router.get("/reviews", reviewController.getAdminReviews);
router.patch("/reviews/:id/moderate", reviewController.moderateReview);
router.delete("/reviews/:id", reviewController.deleteReview);

// Contact Inquiries
router.get("/inquiries", contactInquiryController.getAdminInquiries);
router.patch("/inquiries/:id", contactInquiryController.updateInquiry);

// Newsletter
router.get("/newsletter/export", newsletterController.exportSubscribersCSV);
router.get("/newsletter", newsletterController.getAdminSubscribers);

export default router;
