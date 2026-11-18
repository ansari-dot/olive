import assert from "node:assert";
import fs from "fs";
import path from "path";

const BASE_URL = "http://localhost:5000/api";
let passed = 0;
let failed = 0;

function report(name, condition, extra = "") {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${name} ${extra}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${name} ${extra}`);
  }
}

async function run() {
  console.log("\n=======================================================");
  console.log("  ZAITOON PAKISTAN ADMIN API END-TO-END VERIFICATION  ");
  console.log("=======================================================\n");

  let adminToken = "";
  let adminUser = null;

  // 1. Admin Login
  console.log("--- 1. Admin Auth ---");
  {
    const res = await fetch(`${BASE_URL}/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@zaitoonpakistan.pk",
        password: "ZaitoonAdmin2026!",
      }),
    });
    const data = await res.json();
    report("POST /api/admin/auth/login status 200", res.status === 200);
    report("Login returns token", typeof data.token === "string" && data.token.length > 20);
    report("Login returns admin payload with _id and email", data.admin && data.admin.email === "admin@zaitoonpakistan.pk");
    report("Password is never returned in payload", data.admin && data.admin.password === undefined);
    adminToken = data.token;
    adminUser = data.admin;
  }

  // 2. Auth Me (Valid Token)
  {
    const res = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const data = await res.json();
    report("GET /api/admin/auth/me status 200", res.status === 200);
    report("Me endpoint returns admin _id and role", data.admin && data.admin.role === "super_admin");
  }

  // 3. Auth Me (Invalid Token -> 401)
  {
    const res = await fetch(`${BASE_URL}/admin/auth/me`, {
      headers: { Authorization: "Bearer bad-expired-token-123" },
    });
    report("GET /api/admin/auth/me with invalid token returns 401", res.status === 401);

    const resNoToken = await fetch(`${BASE_URL}/admin/orders`);
    report("GET /api/admin/orders without token returns 401", resNoToken.status === 401);
  }

  const authHeaders = {
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };

  // 4. Dashboard Stats
  console.log("\n--- 2. Dashboard Analytics ---");
  {
    const res = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
      headers: authHeaders,
    });
    const data = await res.json();
    report("GET /api/admin/dashboard/stats status 200", res.status === 200);
    report("Total revenue is number >= 0", typeof data.totalRevenue === "number" && data.totalRevenue >= 0);
    report("Total orders count is number >= 0", typeof data.totalOrdersCount === "number" && data.totalOrdersCount >= 0);
    report("Pending dispatch count exists", typeof data.pendingDispatchCount === "number");
    report("Payment breakdown has COD and IBFT", data.paymentBreakdown && data.paymentBreakdown.cod !== undefined);
    report("Orders by status has stages", data.ordersByStatus && data.ordersByStatus.confirmed !== undefined);
    report("Orders by city is array", Array.isArray(data.ordersByCity));
    report("Low stock products is array", Array.isArray(data.lowStockProducts));
    report("Top selling products is array", Array.isArray(data.topSellingProducts));
    report("Recent orders is array", Array.isArray(data.recentOrders));
    report("Unread inquiries count is number", typeof data.unreadInquiriesCount === "number");
    report("Active coupons count is number", typeof data.activeCouponsCount === "number");
    report("Newsletter count is number", typeof data.newsletterSubscribersCount === "number");
  }

  // 5. Products CRUD & Stock
  console.log("\n--- 3. Products & Stock ---");
  let testProductId = "";
  {
    // List
    const resList = await fetch(`${BASE_URL}/admin/products`, { headers: authHeaders });
    const dataList = await resList.json();
    report("GET /api/admin/products returns array", Array.isArray(dataList.products) && dataList.products.length > 0);

    // Create
    const resCreate = await fetch(`${BASE_URL}/admin/products`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        name: "Test Batch Wild Reserve EVOO",
        brand: "Zaitoon Reserve",
        category: "Olive Oil",
        price: 3400,
        originalPrice: 3800,
        stock: 25,
        size: "750ml",
        image: "/assets/images/featured_card_teardrop_oil_1794769568371.jpg",
        description: "Test description for harvest olive oil.",
        extractionMethod: "First cold mechanical press < 27C",
        acidityLevel: "< 0.25% FFA",
      }),
    });
    const dataCreate = await resCreate.json();
    report("POST /api/admin/products status 201", resCreate.status === 201);
    report("Product created with generated slug and sku", dataCreate.product && !!dataCreate.product.slug && !!dataCreate.product.sku);
    testProductId = dataCreate.product?._id;

    // Update Stock
    const resStock = await fetch(`${BASE_URL}/admin/products/${testProductId}/stock`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ stock: 50 }),
    });
    const dataStock = await resStock.json();
    report("PATCH /api/admin/products/:id/stock updates to 50", dataStock.product?.stock === 50);

    // Update Details
    const resUpdate = await fetch(`${BASE_URL}/admin/products/${testProductId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ price: 3600 }),
    });
    const dataUpdate = await resUpdate.json();
    report("PUT /api/admin/products/:id updates price to 3600", dataUpdate.product?.price === 3600);

    // Delete
    const resDel = await fetch(`${BASE_URL}/admin/products/${testProductId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    report("DELETE /api/admin/products/:id status 200", resDel.status === 200);
  }

  // 6. Image Upload
  console.log("\n--- 4. Media Upload & SVG Rejection ---");
  {
    // Valid PNG upload
    const blob = new Blob([Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")], { type: "image/png" });
    const formData = new FormData();
    formData.append("image", blob, "test-pixel.png");

    const res = await fetch(`${BASE_URL}/admin/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: formData,
    });
    const data = await res.json();
    report("POST /api/admin/upload returns image URL for valid PNG", res.status === 200 && typeof data.url === "string" && data.url.length > 5);

    // Malicious SVG upload rejection check
    const svgBlob = new Blob([Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert('xss')</script></svg>")], { type: "image/svg+xml" });
    const svgForm = new FormData();
    svgForm.append("image", svgBlob, "evil-payload.svg");

    const resSvg = await fetch(`${BASE_URL}/admin/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
      body: svgForm,
    });
    report("POST /api/admin/upload rejects SVG uploads (status 400)", resSvg.status === 400);
  }

  // 7. Coupons Management
  console.log("\n--- 5. Coupons CRUD & Toggle ---");
  let testCouponId = "";
  {
    // Create
    const testCode = `TEST${Date.now().toString().slice(-4)}`;
    const resCreate = await fetch(`${BASE_URL}/admin/coupons`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        code: testCode,
        description: "Test E2E Coupon",
        discountType: "percentage",
        discountValue: 15,
        minOrderAmount: 2000,
        maxDiscountAmount: 500,
        usageLimit: 50,
      }),
    });
    const dataCreate = await resCreate.json();
    report("POST /api/admin/coupons creates coupon", resCreate.status === 201 && dataCreate.coupon?.code === testCode);
    testCouponId = dataCreate.coupon?._id;

    // Toggle
    const resToggle = await fetch(`${BASE_URL}/admin/coupons/${testCouponId}/toggle`, {
      method: "PATCH",
      headers: authHeaders,
    });
    const dataToggle = await resToggle.json();
    report("PATCH /api/admin/coupons/:id/toggle flips active state", dataToggle.coupon?.isActive === false);

    // Update
    const resUpdate = await fetch(`${BASE_URL}/admin/coupons/${testCouponId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ discountValue: 20 }),
    });
    const dataUpdate = await resUpdate.json();
    report("PUT /api/admin/coupons/:id updates discount value", dataUpdate.coupon?.discountValue === 20);

    // Delete
    const resDel = await fetch(`${BASE_URL}/admin/coupons/${testCouponId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    report("DELETE /api/admin/coupons/:id status 200", resDel.status === 200);
  }

  // 8. Orders & Dispatch Lifecycle
  console.log("\n--- 6. Orders & Dispatch Lifecycle ---");
  {
    // List orders
    const resList = await fetch(`${BASE_URL}/admin/orders?page=1&limit=5`, {
      headers: authHeaders,
    });
    const dataList = await resList.json();
    report("GET /api/admin/orders returns paginated orders", Array.isArray(dataList.orders) && typeof dataList.total === "number");

    // Create a new order to test status transitions and cancel with stock restoration
    const resProducts = await fetch(`${BASE_URL}/products?limit=1`);
    const prodData = await resProducts.json();
    const productItem = prodData.products[0];
    const initialStock = productItem.stock;

    // Place order
    const orderRes = await fetch(`${BASE_URL}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: {
          name: "E2E Test Customer",
          phone: "03001234567",
          email: "e2e@test.pk",
        },
        shippingAddress: {
          city: "Islamabad",
          address: "House 10, St 5, F-7/2",
        },
        items: [{ productId: productItem.id || productItem._id, quantity: 2 }],
        paymentMethod: "Cash on Delivery",
      }),
    });
    const orderData = await orderRes.json();
    const newRef = orderData.order.orderReference;
    report("Order placed for lifecycle testing", !!newRef);

    const itemKey = productItem.slug || productItem._id;
    // Verify stock was deducted by 2
    const verifyProd1 = await (await fetch(`${BASE_URL}/products/${itemKey}`)).json();
    report("Stock deducted on order creation", verifyProd1.product.stock === initialStock - 2);

    // GET order detail
    const resDetail = await fetch(`${BASE_URL}/admin/orders/${newRef}`, { headers: authHeaders });
    const dataDetail = await resDetail.json();
    report("GET /api/admin/orders/:orderReference returns full order", dataDetail.order?.orderReference === newRef);

    // PATCH status to 'dispatched'
    const resStatus = await fetch(`${BASE_URL}/admin/orders/${newRef}/status`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ orderStatus: "dispatched", note: "Loaded on TCS Islamabad vehicle" }),
    });
    const dataStatus = await resStatus.json();
    report("PATCH /api/admin/orders/:ref/status updates trackingStage to 3", dataStatus.order?.trackingStage === 3);

    // PATCH tracking
    const resTracking = await fetch(`${BASE_URL}/admin/orders/${newRef}/tracking`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ courierName: "TCS Express", courierTrackingCode: "TCS-998877" }),
    });
    const dataTracking = await resTracking.json();
    report("PATCH /api/admin/orders/:ref/tracking updates tracking code", dataTracking.order?.courierTrackingCode === "TCS-998877");

    // PATCH payment
    const resPayment = await fetch(`${BASE_URL}/admin/orders/${newRef}/payment`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ paymentStatus: "paid", ibftReference: "IBFT-TX-888" }),
    });
    const dataPayment = await resPayment.json();
    report("PATCH /api/admin/orders/:ref/payment marks paid", dataPayment.order?.paymentStatus === "paid");

    // Cancel order and verify stock restoration
    const resCancel = await fetch(`${BASE_URL}/admin/orders/${newRef}/cancel`, {
      method: "PATCH",
      headers: authHeaders,
      body: JSON.stringify({ cancelReason: "Customer test order cancellation" }),
    });
    const dataCancel = await resCancel.json();
    report("PATCH /api/admin/orders/:ref/cancel sets trackingStage to 0", dataCancel.order?.trackingStage === 0 && dataCancel.order?.orderStatus === "cancelled");

    // Verify stock is restored!
    const verifyProd2 = await (await fetch(`${BASE_URL}/products/${itemKey}`)).json();
    report("Inventory stock restored atomically upon cancellation", verifyProd2.product.stock === initialStock);
  }

  // 9. Blogs Management
  console.log("\n--- 7. Orchard Journal Blogs ---");
  let testBlogId = "";
  {
    const resList = await fetch(`${BASE_URL}/admin/blogs`, { headers: authHeaders });
    const dataList = await resList.json();
    report("GET /api/admin/blogs returns array", Array.isArray(dataList.blogs));

    const resCreate = await fetch(`${BASE_URL}/admin/blogs`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        title: "Test Orchard Pruning Guide",
        day: "18",
        month: "Nov",
        excerpt: "An expert walkthrough on seasonal Potohar pruning.",
        readTime: "3 min read",
        image: "/assets/images/story_olive_bottle_sketch_1794767970544.jpg",
        alt: "Potohar Orchard Pruning",
        content: ["Pruning during early spring promotes abundant veraison..."],
        isPublished: true,
      }),
    });
    const dataCreate = await resCreate.json();
    report("POST /api/admin/blogs creates post", resCreate.status === 201 && !!dataCreate.blog?.slug);
    testBlogId = dataCreate.blog?._id;

    const resUpdate = await fetch(`${BASE_URL}/admin/blogs/${testBlogId}`, {
      method: "PUT",
      headers: authHeaders,
      body: JSON.stringify({ title: "Updated Test Orchard Pruning Guide" }),
    });
    const dataUpdate = await resUpdate.json();
    report("PUT /api/admin/blogs/:id updates title", dataUpdate.blog?.title.includes("Updated"));

    const resDel = await fetch(`${BASE_URL}/admin/blogs/${testBlogId}`, {
      method: "DELETE",
      headers: authHeaders,
    });
    report("DELETE /api/admin/blogs/:id status 200", resDel.status === 200);
  }

  // 10. Reviews Moderation
  console.log("\n--- 8. Customer Reviews Moderation ---");
  {
    const resList = await fetch(`${BASE_URL}/admin/reviews`, { headers: authHeaders });
    const dataList = await resList.json();
    report("GET /api/admin/reviews returns populated reviews", Array.isArray(dataList.reviews));

    if (dataList.reviews.length > 0) {
      const rev = dataList.reviews[0];
      const resMod = await fetch(`${BASE_URL}/admin/reviews/${rev._id}/moderate`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ isApproved: !rev.isApproved }),
      });
      const dataMod = await resMod.json();
      report("PATCH /api/admin/reviews/:id/moderate toggles approval", dataMod.review?.isApproved === !rev.isApproved);

      // Restore back
      await fetch(`${BASE_URL}/admin/reviews/${rev._id}/moderate`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ isApproved: rev.isApproved }),
      });
    }
  }

  // 11. Inquiries Management
  console.log("\n--- 9. Contact Inquiries ---");
  {
    const resList = await fetch(`${BASE_URL}/admin/inquiries`, { headers: authHeaders });
    const dataList = await resList.json();
    report("GET /api/admin/inquiries returns array", Array.isArray(dataList.inquiries));

    if (dataList.inquiries.length > 0) {
      const inq = dataList.inquiries[0];
      const resUpdate = await fetch(`${BASE_URL}/admin/inquiries/${inq._id}`, {
        method: "PATCH",
        headers: authHeaders,
        body: JSON.stringify({ status: "in_progress", adminNote: "Contacted via WhatsApp" }),
      });
      const dataUpdate = await resUpdate.json();
      report("PATCH /api/admin/inquiries/:id updates status and adminNote", dataUpdate.inquiry?.status === "in_progress");
    }
  }

  // 12. Newsletter Management & CSV Export
  console.log("\n--- 10. Newsletter & CSV Export ---");
  {
    // Test formula injection defense by adding a subscriber with leading formula character
    await fetch(`${BASE_URL}/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "=calc@danger.pk", source: "=cmd" }),
    });

    const resList = await fetch(`${BASE_URL}/admin/newsletter`, { headers: authHeaders });
    const dataList = await resList.json();
    report("GET /api/admin/newsletter returns subscribers", Array.isArray(dataList.subscribers));

    const resExport = await fetch(`${BASE_URL}/admin/newsletter/export`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const contentType = resExport.headers.get("content-type") || "";
    const contentDisp = resExport.headers.get("content-disposition") || "";
    const csvBody = await resExport.text();

    report("GET /api/admin/newsletter/export has text/csv content-type", contentType.includes("text/csv"));
    report("CSV export has attachment header", contentDisp.includes("attachment"));
    report("CSV body contains expected headers", csvBody.startsWith("email,source,isActive,subscribedAt"));
    report("CSV formula injection characters are neutralized with leading quote", csvBody.includes("\"'=calc@danger.pk\""));
  }

  console.log("\n=======================================================");
  console.log(`  VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED  `);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Verification script failed:", err);
  process.exit(1);
});
