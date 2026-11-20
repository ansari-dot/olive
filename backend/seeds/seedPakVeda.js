import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";

// Models
import AdminUser from "../models/AdminUser.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import BlogPost from "../models/BlogPost.js";
import Review from "../models/Review.js";
import ContactInquiry from "../models/ContactInquiry.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

// Master Catalog Data
import { CATEGORIES_DATA, PRODUCTS_DATA } from "./pakVedaCatalog.js";

const COUPONS_DATA = [
  {
    code: "PAKVEDA10",
    description: "10% Welcome Savings across Pak Veda Catalog",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 2000,
    usageLimit: null,
    usedCount: 24,
    isActive: true,
  },
  {
    code: "ZAITOON10",
    description: "10% Harvest Savings across Zaitoon Pakistan",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 2000,
    usageLimit: null,
    usedCount: 14,
    isActive: true,
  },
  {
    code: "HERBAL500",
    description: "Flat Rs. 500 off on wellness orders above Rs. 4,000",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 4000,
    usageLimit: 500,
    usedCount: 31,
    isActive: true,
  },
];

const BLOGS_DATA = [
  {
    slug: "benefits-of-high-curcumin-turmeric",
    day: "12",
    month: "Nov",
    title: "Why High-Curcumin Single-Origin Turmeric Matters",
    excerpt:
      "Unlike mass-market commercial powders, low-temperature stone-ground Kasur turmeric preserves bioactive volatile curcumins and essential oils.",
    readTime: "4 min read",
    image: "/assets/images/blog_harvest_basket_1794769773942.jpg",
    alt: "Farmer sorting freshly harvested golden turmeric rhizomes",
    content: [
      "Natural turmeric contains curcuminoids—primarily curcumin—which are potent natural anti-inflammatory compounds. In commercial processing, high heat often drives off the delicate volatile essential oils (turmerones) that facilitate cellular absorption.",
      "Pak Veda sources directly from partner family groves in Kasur, drying unpeeled rhizomes under clean solar screens before slow stone-milling below 35°C. Pairing a teaspoon with warm milk and cracked tellicherry black pepper enhances systemic bioavailability by up to 2000%.",
    ],
    isPublished: true,
  },
  {
    slug: "himalayan-shilajit-skardu-purity",
    day: "28",
    month: "Oct",
    title: "Harvesting Karakoram Gold: The Ancient Purity of Skardu Shilajit",
    excerpt:
      "From vertical cliffs above 16,000 feet, raw mineral pitch is hand-gathered and sun-purified to deliver over 75% bio-active fulvic acid.",
    readTime: "5 min read",
    image: "/assets/images/unique_saffron_olive_elixir_1794820496501.jpg",
    alt: "Black mineral resin dripping slowly onto white quartz",
    content: [
      "For centuries, high-altitude villagers across Baltistan have gathered raw Shilajit exuding from rock crevices during hot summer sun. This dense organic matrix is formed through the slow decomposition of ancient medicinal flora compressed over millennia.",
      "Our traditional Surya Tapi extraction uses crystal glacier water and repeated sun filtration over 60 days, yielding a pure, tar-like resin that dissolves completely in warm tea, providing 84 ionic trace minerals in natural balance.",
    ],
    isPublished: true,
  },
  {
    slug: "early-harvest-potohar-olive-oil",
    day: "04",
    month: "Oct",
    title: "Potohar Olive Renaissance: Early Harvest Extra Virgin Certification",
    excerpt:
      "Every Pak Veda olive harvest undergoes laboratory acidity testing below 0.25% and sensory tasting before earning extra virgin bottling.",
    readTime: "5 min read",
    image: "/assets/images/blog_pruning_grower_1794769773955.jpg",
    alt: "Olive grove grower pruning silvery-green olive branches under a clear blue sky",
    content: [
      "True extra virgin certification requires two distinct benchmarks: zero sensory defects during blind tasting and strict chemical purity verified in the laboratory.",
      "Our Potohar green olive batches consistently test under 0.22% free fatty acidity with polyphenol concentrations exceeding 400 mg/kg, bottled unfiltered under inert nitrogen to safeguard freshness on kitchen tables across Pakistan.",
    ],
    isPublished: true,
  },
];

async function seed() {
  console.log("=================================================");
  console.log("🌿 STARTING PAK VEDA MASTER SEED SCRIPT");
  console.log("=================================================");

  await connectDB();

  // 1. Clear existing collections
  console.log("🧹 Clearing old database collections...");
  await Promise.all([
    AdminUser.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Coupon.deleteMany({}),
    Order.deleteMany({}),
    BlogPost.deleteMany({}),
    Review.deleteMany({}),
    ContactInquiry.deleteMany({}),
    NewsletterSubscriber.deleteMany({}),
  ]);
  console.log("✅ Collections cleared cleanly.");

  // 2. Seed Admin User
  const adminEmail = (env.ADMIN_BOOTSTRAP.EMAIL || "admin@zaitoonpakistan.pk").toLowerCase();
  const adminPassword = env.ADMIN_BOOTSTRAP.PASSWORD || "ZaitoonAdmin2026!";
  const adminName = env.ADMIN_BOOTSTRAP.NAME || "Pak Veda Administrator";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const adminUser = await AdminUser.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "super_admin",
    isActive: true,
  });
  console.log(`✅ Seeded Super Admin: ${adminUser.email} / ${adminPassword}`);

  // 3. Count products per category and subcategory
  const productCountByCategory = {};
  const productCountBySubcategory = {};

  PRODUCTS_DATA.forEach((p) => {
    productCountByCategory[p.category] = (productCountByCategory[p.category] || 0) + 1;
    if (p.subcategory) {
      const subKey = `${p.category}:::${p.subcategory}`;
      productCountBySubcategory[subKey] = (productCountBySubcategory[subKey] || 0) + 1;
    }
  });

  // Prepare Categories with calculated counts
  const categoriesToInsert = CATEGORIES_DATA.map((cat) => {
    const totalCount = productCountByCategory[cat.name] || 0;
    const subcats = (cat.subcategories || []).map((sub) => {
      const subKey = `${cat.name}:::${sub.name}`;
      const count = productCountBySubcategory[subKey] || sub.count || 0;
      return {
        ...sub,
        count,
      };
    });
    return {
      ...cat,
      count: totalCount,
      subcategories: subcats,
    };
  });

  // 4. Seed Categories
  console.log(`📁 Seeding ${categoriesToInsert.length} Pak Veda Categories & Subcategories...`);
  const createdCategories = await Category.insertMany(categoriesToInsert);
  console.log(`✅ Seeded ${createdCategories.length} Categories successfully.`);

  // 5. Seed Products
  console.log(`🍃 Seeding ${PRODUCTS_DATA.length} Pak Veda Portfolio Products...`);
  const createdProducts = await Product.insertMany(PRODUCTS_DATA);
  console.log(`✅ Seeded ${createdProducts.length} Products successfully.`);

  const productMap = {};
  createdProducts.forEach((p) => {
    productMap[p.slug] = p;
  });

  // 6. Seed Sample Customer Reviews
  const sampleReviews = [
    {
      product: productMap["pak-veda-early-harvest-evoo-reserve"]?._id || createdProducts[0]._id,
      author: "Dr. Farooq Siddiqui (Karachi)",
      rating: 5,
      comment: "Remarkable peppery freshness and deep green bouquet. True early harvest cold-press of international grade.",
      isApproved: true,
    },
    {
      product: productMap["pak-veda-turmeric-powder"]?._id || createdProducts[1]._id,
      author: "Tahira Naqvi (Lahore)",
      rating: 5,
      comment: "The color and fragrance are leagues ahead of supermarket turmeric. Whisked into golden milk every night.",
      isApproved: true,
    },
    {
      product: productMap["pak-veda-pure-himalayan-shilajit-resin"]?._id || createdProducts[2]._id,
      author: "Capt. Rehan Aslam (Islamabad)",
      rating: 5,
      comment: "Dissolves cleanly with zero gritty residue. Authentic Skardu resin with intense potency.",
      isApproved: true,
    },
    {
      product: productMap["pak-veda-wild-sidr-honey-himalayan"]?._id || createdProducts[3]._id,
      author: "Zainab Bokhari (Peshawar)",
      rating: 5,
      comment: "Raw Beri honey at its finest. Thick, floral, and soothes dry throats immediately.",
      isApproved: true,
    },
  ];
  await Review.insertMany(sampleReviews);
  console.log("✅ Seeded Sample Product Reviews.");

  // 7. Seed Coupons
  console.log("🎟️ Seeding promotional coupons...");
  const createdCoupons = await Coupon.insertMany(COUPONS_DATA);
  console.log(`✅ Seeded ${createdCoupons.length} Coupons.`);

  // 8. Seed Blog Posts
  console.log("📰 Seeding educational blog posts...");
  const createdBlogs = await BlogPost.insertMany(BLOGS_DATA);
  console.log(`✅ Seeded ${createdBlogs.length} Blog Posts.`);

  // 9. Seed Sample Orders for Tracking Test (PV-1042 & PV-1088)
  console.log("📦 Seeding sample tracked orders (PV-1042 & PV-1088)...");
  const p1 = productMap["pak-veda-early-harvest-evoo-reserve"] || createdProducts[0];
  const p2 = productMap["pak-veda-wild-sidr-honey-himalayan"] || createdProducts[1];
  const p3 = productMap["pak-veda-turmeric-powder"] || createdProducts[2];
  const p4 = productMap["pak-veda-kashmiri-chilli-powder"] || createdProducts[3];

  const sampleOrders = [
    {
      orderReference: "PV-1042",
      courierName: "TCS Express",
      courierTrackingCode: "TCS-901428",
      orderStatus: "out_for_delivery",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "pending_cod",
      customer: {
        name: "Bilal Ahmad",
        email: "bilal.ahmad@gmail.com",
        phone: "+92 300 4521098",
      },
      shippingAddress: {
        city: "Islamabad",
        area: "Sector F-8/2",
        address: "House 42, Street 7, Sector F-8/2",
        notes: "Leave with security if not home",
      },
      items: [
        {
          product: p1._id,
          slug: p1.slug,
          name: p1.name,
          size: p1.size,
          image: p1.image,
          price: p1.price,
          quantity: 1,
          lineTotal: p1.price,
        },
        {
          product: p2._id,
          slug: p2.slug,
          name: p2.name,
          size: p2.size,
          image: p2.image,
          price: p2.price,
          quantity: 1,
          lineTotal: p2.price,
        },
      ],
      subtotal: p1.price + p2.price,
      shippingFee: 0,
      discountAmount: 0,
      total: p1.price + p2.price,
      statusHistory: [
        {
          stage: 1,
          orderStatus: "confirmed",
          note: "Order Confirmed — Batch Verified at Islamabad Hub",
          updatedBy: "System",
          timestamp: new Date(Date.now() - 48 * 3600000),
        },
        {
          stage: 2,
          orderStatus: "cold_packed",
          note: "Artisanal glass bottles protected in thermal cushioning sleeves",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 36 * 3600000),
        },
        {
          stage: 3,
          orderStatus: "dispatched",
          note: "In Transit via TCS Express Linehaul (TCS-901428)",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 18 * 3600000),
        },
        {
          stage: 4,
          orderStatus: "out_for_delivery",
          note: "Out with courier rider for contactless COD delivery",
          updatedBy: "TCS Courier",
          timestamp: new Date(Date.now() - 3 * 3600000),
        },
      ],
    },
    {
      orderReference: "PV-1088",
      courierName: "TCS Express",
      courierTrackingCode: "TCS-108890",
      orderStatus: "delivered",
      paymentMethod: "Cash on Delivery",
      paymentStatus: "paid",
      customer: {
        name: "Hassan Raza",
        email: "hassan.raza@outlook.com",
        phone: "+92 321 8899221",
      },
      shippingAddress: {
        city: "Karachi",
        area: "Clifton Block 4",
        address: "Apartment 5B, Ocean Heights, Clifton Block 4",
        notes: "Deliver during office hours",
      },
      items: [
        {
          product: p3._id,
          slug: p3.slug,
          name: p3.name,
          size: p3.size,
          image: p3.image,
          price: p3.price,
          quantity: 2,
          lineTotal: p3.price * 2,
        },
        {
          product: p4._id,
          slug: p4.slug,
          name: p4.name,
          size: p4.size,
          image: p4.image,
          price: p4.price,
          quantity: 1,
          lineTotal: p4.price,
        },
      ],
      subtotal: p3.price * 2 + p4.price,
      shippingFee: 0,
      discountAmount: 200,
      total: p3.price * 2 + p4.price - 200,
      statusHistory: [
        {
          stage: 1,
          orderStatus: "confirmed",
          note: "Order Confirmed — Batch Verified at Islamabad Hub",
          updatedBy: "System",
          timestamp: new Date(Date.now() - 96 * 3600000),
        },
        {
          stage: 2,
          orderStatus: "cold_packed",
          note: "Pouch freshness seal verified",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 80 * 3600000),
        },
        {
          stage: 3,
          orderStatus: "dispatched",
          note: "In Transit via TCS Express Linehaul to Karachi (TCS-108890)",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 48 * 3600000),
        },
        {
          stage: 4,
          orderStatus: "delivered",
          note: "Delivered and Cash on Delivery collected by TCS rider (Signed: Hassan Raza)",
          updatedBy: "TCS Express",
          timestamp: new Date(Date.now() - 24 * 3600000),
        },
      ],
    },
  ];

  await Order.insertMany(sampleOrders);
  console.log("✅ Seeded Orders PV-1042 and PV-1088.");

  // 10. Seed Sample Inquiry & Subscribers
  await ContactInquiry.create({
    name: "Dr. Farooq Siddiqui",
    contactInfo: "farooq.siddiqui@aku.edu",
    city: "Karachi",
    topic: "Bulk & Corporate Gifting",
    message: "Inquiring about 50 corporate gift boxes of Pak Veda early harvest EVOO, Sidr honey, and Kashmir Mongra Saffron.",
    status: "new",
  });

  await NewsletterSubscriber.insertMany([
    { email: "harvest.patron@gmail.com", source: "Harvest Letter", isActive: true },
    { email: "dr.farooq@aku.edu", source: "Website Footer", isActive: true },
  ]);
  console.log("✅ Seeded Sample Inquiry and Newsletter Subscribers.");

  console.log("=================================================");
  console.log("🎉 PAK VEDA SEEDING COMPLETED SUCCESSFULLY!");
  console.log(`📁 28 Categories Seeded`);
  console.log(`🍃 ${createdProducts.length} Master Portfolio Products Seeded`);
  console.log("=================================================");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
