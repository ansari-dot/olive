const BASE_URL = "http://localhost:5000";

async function runTests() {
  console.log("=================================================");
  console.log("🚀 COMMENCING ZAITOON PAKISTAN ENDPOINT VERIFICATION");
  console.log("=================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = "") {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // TEST 1: Product filtering & search
    // -------------------------------------------------------------
    console.log("\n--- TEST 1: Products, Filtering & Search ---");
    const prodRes = await fetch(`${BASE_URL}/api/products?category=Bottled&sort=price-asc`);
    const prodData = await prodRes.json();
    assert(prodRes.status === 200, "GET /api/products?category=Bottled&sort=price-asc returns 200");
    assert(Array.isArray(prodData.products) && prodData.products.length > 0, "Products array returned", `Count: ${prodData.products?.length}`);
    assert(prodData.products.every(p => p.category === "Bottled"), "All filtered products have category 'Bottled'");
    // Verify ascending order
    const prices = prodData.products.map(p => p.price);
    const isSorted = prices.every((val, i, arr) => !i || arr[i - 1] <= val);
    assert(isSorted, "Products sorted by price ascending", `Prices: ${prices.join(", ")}`);

    // Filters endpoint
    const filterRes = await fetch(`${BASE_URL}/api/products/filters`);
    const filterData = await filterRes.json();
    assert(filterRes.status === 200, "GET /api/products/filters returns 200");
    assert(Array.isArray(filterData.categories) && filterData.categories.length > 0, "Categories returned in filters");
    assert(Array.isArray(filterData.flavours) && filterData.flavours.length > 0, "Flavours returned in filters");
    assert(Array.isArray(filterData.origins) && filterData.origins.length > 0, "Origins returned in filters");

    // Single product detail & approved reviews
    const slug = "grid-extra-virgin-reserve";
    const singleRes = await fetch(`${BASE_URL}/api/products/${slug}`);
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, `GET /api/products/${slug} returns 200`);
    assert(singleData.product?.name === "Extra Virgin Reserve", "Product detail resolved correctly");
    assert(Array.isArray(singleData.relatedProducts), "Related products array returned");

    // Submit public review
    const reviewRes = await fetch(`${BASE_URL}/api/products/${slug}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        author: "Fatima Noor (Rawalpindi)",
        rating: 5,
        comment: "Exceptional fragrance and peppery finish. Best olive oil in Pakistan!",
      }),
    });
    const reviewData = await reviewRes.json();
    assert(reviewRes.status === 201, "POST /api/products/:idOrSlug/reviews returns 201");
    assert(reviewData.success === true, "Review submitted and product rating recalculated");

    // -------------------------------------------------------------
    // TEST 2: Coupon validation (ZAITOON10 & HARVEST500)
    // -------------------------------------------------------------
    console.log("\n--- TEST 2: Coupon Validation Engine ---");
    // ZAITOON10 on Rs. 3,000 subtotal
    const c1Res = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "ZAITOON10", subtotal: 3000 }),
    });
    const c1Data = await c1Res.json();
    assert(c1Res.status === 200 && c1Data.valid === true, "Validate ZAITOON10 returns valid: true");
    assert(c1Data.discountAmount === 300, "10% of 3000 = Rs. 300 discount", `Got: ${c1Data.discountAmount}`);
    assert(c1Data.shippingFee === 0, "Effective subtotal 2700 >= 1200 => Free Shipping", `Got: ${c1Data.shippingFee}`);
    assert(c1Data.finalTotal === 2700, "Final total = 2700 PKR", `Got: ${c1Data.finalTotal}`);

    // Alias /api/promo/validate
    const promoRes = await fetch(`${BASE_URL}/api/promo/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "ZAITOON10", subtotal: 1000 }),
    });
    const promoData = await promoRes.json();
    assert(promoRes.status === 200, "Alias POST /api/promo/validate works");
    assert(promoData.shippingFee === 200, "Effective subtotal 900 < 1200 => Shipping fee Rs. 200", `Got: ${promoData.shippingFee}`);

    // HARVEST500 (requires >= 4000)
    const c2UnderRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "HARVEST500", subtotal: 2500 }),
    });
    assert(c2UnderRes.status === 400, "HARVEST500 rejected when subtotal < Rs. 4,000");

    const c2OkRes = await fetch(`${BASE_URL}/api/coupons/validate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "HARVEST500", subtotal: 5000 }),
    });
    const c2OkData = await c2OkRes.json();
    assert(c2OkRes.status === 200 && c2OkData.valid === true, "HARVEST500 valid when subtotal >= Rs. 4,000");
    assert(c2OkData.discountAmount === 500, "Flat discount = Rs. 500", `Got: ${c2OkData.discountAmount}`);

    // -------------------------------------------------------------
    // TEST 3: Guest Checkout & Stock Deduction
    // -------------------------------------------------------------
    console.log("\n--- TEST 3: Guest Checkout & Stock Deduction ---");
    // Check initial stock for 'shop-3'
    const shop3PreRes = await fetch(`${BASE_URL}/api/products/shop-3`);
    const shop3Pre = await shop3PreRes.json();
    const initialStock = shop3Pre.product.stock;

    const orderPayload = {
      customer: {
        name: "Usman Ghani",
        phone: "0333-1234567",
        email: "usman.ghani@outlook.com",
      },
      shippingAddress: {
        city: "Islamabad",
        area: "Sector F-10/2",
        address: "Street 14, House 112",
        notes: "Leave with security",
      },
      items: [
        {
          productId: shop3Pre.product._id,
          quantity: 2,
        },
      ],
      paymentMethod: "Bank Transfer (IBFT)",
      couponCode: "ZAITOON10",
    };

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderPayload),
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, "POST /api/orders returns 201 Created");
    assert(orderData.success === true, "Order created successfully");
    assert(orderData.order?.orderReference?.startsWith("ZP-"), "Order reference format is ZP-XXXX", `Ref: ${orderData.order?.orderReference}`);
    assert(orderData.bankDetails?.bankName === "Meezan Bank Limited", "Bank Transfer details returned for IBFT");
    assert(orderData.order.paymentStatus === "awaiting_ibft", "paymentStatus is 'awaiting_ibft'");

    const createdOrderRef = orderData.order.orderReference;

    // Verify stock deduction
    const shop3PostRes = await fetch(`${BASE_URL}/api/products/shop-3`);
    const shop3Post = await shop3PostRes.json();
    assert(
      shop3Post.product.stock === initialStock - 2,
      "Inventory atomically decremented by ordered quantity (2)",
      `Before: ${initialStock}, After: ${shop3Post.product.stock}`
    );

    // -------------------------------------------------------------
    // TEST 4: Public Order Tracking (ZP-1042)
    // -------------------------------------------------------------
    console.log("\n--- TEST 4: Public Order Tracking ---");
    const trackRes = await fetch(`${BASE_URL}/api/orders/track/ZP-1042`);
    const trackData = await trackRes.json();
    assert(trackRes.status === 200, "GET /api/orders/track/ZP-1042 returns 200");
    assert(trackData.orderReference === "ZP-1042", "Order reference matches ZP-1042");
    assert(trackData.city === "Lahore", "City matches Lahore");
    assert(trackData.trackingStage === 3, "trackingStage matches 3 (In Transit)");
    assert(Array.isArray(trackData.timeline) && trackData.timeline.length === 4, "4-step timeline returned");
    assert(trackData.timeline[0].completed && trackData.timeline[1].completed && trackData.timeline[2].completed, "Stages 1, 2, 3 marked completed");

    // Case-insensitivity test
    const trackLower = await fetch(`${BASE_URL}/api/orders/track/zp-1042`);
    assert(trackLower.status === 200, "Order tracking lookup is case-insensitive (zp-1042)");

    // -------------------------------------------------------------
    // TEST 5: Admin Login, Dashboard, Status Advance & Cancel (Restoring Stock)
    // -------------------------------------------------------------
    console.log("\n--- TEST 5: Admin Workflow (Login -> Stats -> Advance -> Cancel & Restore Stock) ---");
    // Admin login
    const loginRes = await fetch(`${BASE_URL}/api/admin/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin@zaitoonpakistan.pk",
        password: "ZaitoonAdmin2026!",
      }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, "POST /api/admin/auth/login returns 200");
    assert(!!loginData.token, "Admin JWT token returned");

    const token = loginData.token;
    const adminHeaders = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    // Admin Me
    const meRes = await fetch(`${BASE_URL}/api/admin/auth/me`, { headers: adminHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200 && meData.admin?.role === "super_admin", "GET /api/admin/auth/me verifies super_admin");

    // Dashboard Stats
    const statsRes = await fetch(`${BASE_URL}/api/admin/dashboard/stats`, { headers: adminHeaders });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, "GET /api/admin/dashboard/stats returns 200");
    assert(typeof statsData.totalRevenue === "number" && statsData.totalRevenue > 0, "totalRevenue calculated in PKR", `PKR ${statsData.totalRevenue}`);
    assert(statsData.totalOrdersCount >= 3, "totalOrdersCount reflects existing and created orders", `Count: ${statsData.totalOrdersCount}`);
    assert(statsData.paymentBreakdown?.cod && statsData.paymentBreakdown?.ibft, "paymentBreakdown COD and IBFT present");
    assert(Array.isArray(statsData.ordersByCity) && statsData.ordersByCity.length > 0, "ordersByCity returned with Pakistan hubs");

    // Advance Order Status (cold_packed -> dispatched)
    const advanceRes = await fetch(`${BASE_URL}/api/admin/orders/${createdOrderRef}/status`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        orderStatus: "dispatched",
        note: "Dispatched via TCS Express overnight linehaul",
      }),
    });
    const advanceData = await advanceRes.json();
    assert(advanceRes.status === 200, `PATCH /api/admin/orders/${createdOrderRef}/status returns 200`);
    assert(advanceData.order.orderStatus === "dispatched", "Order status advanced to 'dispatched'");
    assert(advanceData.order.trackingStage === 3, "Tracking stage mapped to 3");

    // Cancel Order & Verify Stock Restoration
    const cancelRes = await fetch(`${BASE_URL}/api/admin/orders/${createdOrderRef}/cancel`, {
      method: "PATCH",
      headers: adminHeaders,
      body: JSON.stringify({
        cancelReason: "Customer requested cancellation before dispatch handover",
      }),
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, `PATCH /api/admin/orders/${createdOrderRef}/cancel returns 200`);
    assert(cancelData.order.orderStatus === "cancelled", "Order marked cancelled");
    assert(cancelData.order.trackingStage === 0, "Tracking stage set to 0");

    // Verify stock restoration
    const shop3RestoredRes = await fetch(`${BASE_URL}/api/products/shop-3`);
    const shop3Restored = await shop3RestoredRes.json();
    assert(
      shop3Restored.product.stock === initialStock,
      "Inventory atomically RESTORED back to original level upon cancellation",
      `Expected: ${initialStock}, Actual: ${shop3Restored.product.stock}`
    );

    // Admin Coupon Create & Toggle
    const newCouponRes = await fetch(`${BASE_URL}/api/admin/coupons`, {
      method: "POST",
      headers: adminHeaders,
      body: JSON.stringify({
        code: "TESTRAMADAN20",
        description: "20% Ramadan Harvest Savings",
        discountType: "percentage",
        discountValue: 20,
        minOrderAmount: 2000,
      }),
    });
    const newCouponData = await newCouponRes.json();
    assert(newCouponRes.status === 201, "POST /api/admin/coupons creates new coupon");
    const couponId = newCouponData.coupon._id;

    // Toggle coupon active state
    const toggleRes = await fetch(`${BASE_URL}/api/admin/coupons/${couponId}/toggle`, {
      method: "PATCH",
      headers: adminHeaders,
    });
    const toggleData = await toggleRes.json();
    assert(toggleRes.status === 200 && toggleData.coupon.isActive === false, "PATCH /api/admin/coupons/:id/toggle deactivates coupon");

    // Clean up test coupon
    await fetch(`${BASE_URL}/api/admin/coupons/${couponId}`, {
      method: "DELETE",
      headers: adminHeaders,
    });
    console.log("Cleaned up test coupon.");

    // Blogs, Contact & Newsletter
    const blogRes = await fetch(`${BASE_URL}/api/blogs`);
    const blogData = await blogRes.json();
    assert(blogRes.status === 200 && blogData.blogs?.length >= 3, "GET /api/blogs returns 3 published blog posts");

    const contactRes = await fetch(`${BASE_URL}/api/contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Sarmad Jalil",
        contactInfo: "sarmad.jalil@gmail.com",
        city: "Peshawar",
        topic: "Product Harvest & Lab Purity",
        message: "Requesting batch certificate of analysis for the first cold press olive oil.",
      }),
    });
    assert(contactRes.status === 201, "POST /api/contact submits inquiry");

    const newsRes = await fetch(`${BASE_URL}/api/newsletter`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sarmad.jalil@gmail.com" }),
    });
    assert(newsRes.status === 200 || newsRes.status === 201, "POST /api/newsletter subscribes email idempotently");

    console.log("\n=================================================");
    console.log(`🏁 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("=================================================");
    if (failed > 0) process.exit(1);
    process.exit(0);
  } catch (err) {
    console.error("Test execution failed unexpectedly:", err);
    process.exit(1);
  }
}

runTests();
