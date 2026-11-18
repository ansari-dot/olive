import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";

// Models
import AdminUser from "../models/AdminUser.js";
import Product from "../models/Product.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import BlogPost from "../models/BlogPost.js";
import Review from "../models/Review.js";
import ContactInquiry from "../models/ContactInquiry.js";
import NewsletterSubscriber from "../models/NewsletterSubscriber.js";

const PRODUCTS_DATA = [
  // 1. Featured Grid Products
  {
    slug: "grid-extra-virgin-reserve",
    sku: "ZP-EVOO-501",
    name: "Extra Virgin Reserve",
    brand: "Zaitoon Reserve",
    category: "Olive Oil",
    price: 2200,
    rating: 3,
    size: "500 ml Slender Bottle",
    description: "Single-harvest cold-pressed extra virgin olive oil bottled with a natural cork stopper.",
    image: "/assets/images/featured_card_teardrop_oil_1794769568371.jpg",
    origin: "Potohar",
    sections: ["featured-grid", "shop"],
    stock: 45,
    soldCount: 18,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.3% Free Fatty Acidity",
  },
  {
    slug: "grid-pure-estate",
    sku: "ZP-CP-502",
    name: "100% Pure Estate",
    brand: "Chakwal Press",
    category: "Olive Oil",
    price: 2450,
    rating: 4,
    size: "500 ml Glass Cruet",
    description: "Estate-grown Potohar olive oil pressed within hours of picking for bright herbaceous flavor.",
    image: "/assets/images/featured_card_estate_cruet_1794769569072.jpg",
    origin: "Chakwal",
    sections: ["featured-grid", "shop"],
    stock: 40,
    soldCount: 22,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.28% Free Fatty Acidity",
  },
  {
    slug: "grid-potohar-classic",
    sku: "ZP-ZR-503",
    name: "Potohar Classic Oil",
    brand: "Zaitoon Reserve",
    category: "Olive Oil",
    price: 2600,
    rating: 5,
    size: "500 ml Pourer",
    description: "Unfiltered cold-pressed table oil presented in a classic square pouring cruet.",
    image: "/assets/images/featured_card_pourer_olives_1794769570377.jpg",
    origin: "Potohar",
    sections: ["featured-grid", "best-sellers", "shop"],
    stock: 35,
    soldCount: 50,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.25% Free Fatty Acidity",
  },
  {
    slug: "grid-orchard-olives",
    sku: "ZP-CP-504",
    name: "Orchard Green Olives",
    brand: "Chakwal Press",
    category: "Table Olives",
    price: 1450,
    rating: 5,
    size: "400 g Glass Jar",
    description: "Plump hand-picked green olives naturally cured in sea salt brine without artificial preservatives.",
    image: "/assets/images/featured_card_green_olives_1794769570392.jpg",
    origin: "Chakwal",
    sections: ["featured-grid", "shop"],
    stock: 60,
    soldCount: 30,
    extractionMethod: "Naturally Brined, Traditional Wood Vat Cured",
    acidityLevel: "N/A — Table Olives",
  },

  // 2. Unique Products
  {
    slug: "unique-saffron-pepper-oil",
    sku: "ZP-ZR-505",
    name: "Kashmiri Saffron & Peppercorn Reserve",
    brand: "Zaitoon Reserve",
    category: "Spill",
    flavour: "Pepper",
    origin: "Potohar",
    price: 3450,
    rating: 5,
    isNew: true,
    size: "350 ml Apothecary Bottle",
    description: "Slowly cold-macerated over 21 days with crimson Kashmiri saffron stigmas and cracked tellicherry peppercorns for finishing grilled meats and saffron rice.",
    image: "/assets/images/unique_saffron_olive_elixir_1794820496501.jpg",
    tag: "Rare Infusion",
    sections: ["unique", "shop"],
    stock: 25,
    soldCount: 15,
    extractionMethod: "Cold Macerated 21 Days, Unfiltered",
    acidityLevel: "< 0.3% Free Fatty Acidity",
  },
  {
    slug: "unique-sidr-raw-honeycomb",
    sku: "ZP-HS-506",
    name: "Wild Himalayan Sidr Raw Honeycomb",
    brand: "Himalayan Sidr",
    category: "Raw Honey",
    flavour: "Cardamom",
    origin: "Karak & Swat",
    price: 4200,
    rating: 5,
    isNew: true,
    size: "500 g Comb-in-Jar",
    description: "Hand-cut unheated jujube honeycomb suspended in pure amber Sidr honey, complete with a turned olive-wood dipper.",
    image: "/assets/images/unique_sidr_honeycomb_jar_1794820496427.jpg",
    tag: "Limited Harvest",
    sections: ["unique", "shop"],
    stock: 20,
    soldCount: 35,
    extractionMethod: "Unheated, Centrifuged & Hand-Cut Raw Comb",
    acidityLevel: "N/A — Monofloral Jujube Honey",
  },
  {
    slug: "unique-olive-castile-balm",
    sku: "ZP-VG-507",
    name: "Cold-Pressed Olive Castile & Leaf Salve",
    brand: "Verdant Grove",
    category: "Home",
    flavour: "Basil",
    origin: "Chakwal",
    price: 1950,
    rating: 5,
    isNew: true,
    size: "2 × 120 g Soaps + 60 ml Salve",
    description: "Traditional 100% olive-oil cold-cured Castile soap bars paired with wild beeswax and olive-leaf restorative skin salve.",
    image: "/assets/images/unique_olive_botanical_soap_1794820496298.jpg",
    tag: "Artisan Craft",
    sections: ["unique", "shop"],
    stock: 30,
    soldCount: 20,
    extractionMethod: "Cold Processed, 8-Week Cured Botanical Bar",
    acidityLevel: "N/A — Pure Botanical Skincare",
  },
  {
    slug: "unique-olive-leaf-lemongrass",
    sku: "ZP-VG-508",
    name: "Sun-Dried Olive Leaf & Highland Tea",
    brand: "Verdant Grove",
    category: "Botanical Infusions",
    flavour: "Ginger",
    origin: "Swat Valley",
    price: 1450,
    rating: 5,
    size: "200 g Matte Caddy",
    description: "Whole young olive orchard leaves air-dried in shade and blended with mountain lemongrass and wild rosemary for crisp caffeine-free sipping.",
    image: "/assets/images/product_herbal_infusion_1794763964623.jpg",
    tag: "Botanical",
    sections: ["unique", "shop"],
    stock: 50,
    soldCount: 25,
    extractionMethod: "Shade Air-Dried, Coarse Cut Leaves",
    acidityLevel: "N/A — Herbal Infusion",
  },

  // 3. Shop Products (shop-1 through shop-15)
  {
    slug: "shop-1",
    sku: "ZP-ZR-509",
    name: "Olives of Spring Estate",
    brand: "Zaitoon Reserve",
    category: "Bottled",
    flavour: "Basil",
    origin: "Potohar",
    price: 3900,
    rating: 5,
    isNew: true,
    popularity: 96,
    size: "500 ml Dark Glass",
    description: "First spring harvest extra virgin olive oil with bright herbaceous character.",
    image: "/assets/images/card_oil_bottle_2_1794769257277.jpg",
    sections: ["shop", "best-sellers"],
    stock: 32,
    soldCount: 48,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.22% Free Fatty Acidity",
  },
  {
    slug: "shop-2",
    sku: "ZP-CP-510",
    name: "Potohar Cold-Pressed Cruet",
    brand: "Chakwal Press",
    category: "Cooking",
    flavour: "Pepper",
    origin: "Chakwal",
    price: 2400,
    originalPrice: 3600,
    rating: 4,
    isSale: true,
    popularity: 99,
    size: "500 ml Glass Cruet",
    description: "Smooth cold-pressed olive oil presented with a hand-corked pouring spout.",
    image: "/assets/images/featured_card_estate_cruet_1794769569072.jpg",
    sections: ["shop", "best-sellers"],
    stock: 28,
    soldCount: 65,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.28% Free Fatty Acidity",
  },
  {
    slug: "shop-3",
    sku: "ZP-CP-511",
    name: "Chakwal Golden Harvest",
    brand: "Chakwal Press",
    category: "Pack 0.5lt",
    flavour: "Cardamom",
    origin: "Chakwal",
    price: 2800,
    rating: 5,
    popularity: 88,
    size: "500 ml Pourer",
    description: "Balanced estate oil ideal for salad dressings, grilling, and roasting.",
    image: "/assets/images/featured_card_pourer_olives_1794769570377.jpg",
    sections: ["shop"],
    stock: 40,
    soldCount: 24,
    extractionMethod: "Continuous Centrifuge Cold-Extraction",
    acidityLevel: "< 0.3% Free Fatty Acidity",
  },
  {
    slug: "shop-4",
    sku: "ZP-ZR-512",
    name: "Swat Valley Table Oil",
    brand: "Zaitoon Reserve",
    category: "Home",
    flavour: "Ginger",
    origin: "Swat Valley",
    price: 3200,
    rating: 4,
    popularity: 84,
    size: "500 ml Glass Decanter",
    description: "Delicate golden finishing oil pressed from early-autumn orchard olives.",
    image: "/assets/images/card_oil_decanter_3_1794769257286.jpg",
    sections: ["shop"],
    stock: 25,
    soldCount: 19,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.25% Free Fatty Acidity",
  },
  {
    slug: "shop-5",
    sku: "ZP-CP-513",
    name: "Kalamata Cured Olives",
    brand: "Chakwal Press",
    category: "Oily",
    flavour: "Pepper",
    origin: "Mediterranean",
    price: 2100,
    rating: 4,
    popularity: 92,
    size: "350 g Reserve",
    description: "Plump dark olives cured gently in sea salt brine and cold-pressed oil.",
    image: "/assets/images/shop_card_black_olives_1794770041630.jpg",
    sections: ["shop"],
    stock: 55,
    soldCount: 38,
    extractionMethod: "Traditional Brine Marinated",
    acidityLevel: "N/A — Table Olives",
  },
  {
    slug: "shop-6",
    sku: "ZP-ZR-514",
    name: "Teardrop Reserve Olive Oil",
    brand: "Zaitoon Reserve",
    category: "Gift Card",
    flavour: "Basil",
    origin: "Potohar",
    price: 1850,
    originalPrice: 2950,
    rating: 5,
    isSale: true,
    popularity: 95,
    size: "500 ml Teardrop",
    description: "Twine-tied artisanal gift bottle filled with unrefined Potohar olive oil.",
    image: "/assets/images/featured_card_teardrop_oil_1794769568371.jpg",
    sections: ["shop"],
    stock: 34,
    soldCount: 42,
    extractionMethod: "First Cold-Press (< 27°C), Unfiltered",
    acidityLevel: "< 0.26% Free Fatty Acidity",
  },
  {
    slug: "shop-7",
    sku: "ZP-CP-515",
    name: "Alfonso Orchard Olives",
    brand: "Chakwal Press",
    category: "Eco Pack",
    flavour: "Basil",
    origin: "Potohar",
    price: 1650,
    rating: 5,
    isNew: true,
    popularity: 90,
    size: "400 g Pack",
    description: "Crisp hand-picked green olives harvested at peak mineral richness.",
    image: "/assets/images/featured_card_green_olives_1794769570392.jpg",
    sections: ["shop"],
    stock: 50,
    soldCount: 31,
    extractionMethod: "Sea Salt Water Cure",
    acidityLevel: "N/A — Table Olives",
  },
  {
    slug: "shop-8",
    sku: "ZP-ZR-516",
    name: "Everyday Cooking Olive Oil",
    brand: "Zaitoon Reserve",
    category: "Cooking",
    flavour: "Ginger",
    origin: "Chakwal",
    price: 2950,
    rating: 5,
    popularity: 87,
    size: "750 ml Glass Cruet",
    description: "High-stability extra virgin cooking oil for sautéing and family meals.",
    image: "/assets/images/card_oil_cruet_1_1794769256413.jpg",
    sections: ["shop"],
    stock: 48,
    soldCount: 29,
    extractionMethod: "Cold-Pressed & Settled",
    acidityLevel: "< 0.35% Free Fatty Acidity",
  },
  {
    slug: "shop-9",
    sku: "ZP-CP-517",
    name: "Whole Brined Green Olives",
    brand: "Chakwal Press",
    category: "Tin 0.5lt",
    flavour: "Cardamom",
    origin: "Potohar",
    price: 1550,
    rating: 5,
    popularity: 91,
    size: "450 g Glass Jar",
    description: "Firm whole green table olives packed naturally in mild mountain brine.",
    image: "/assets/images/shop_card_olive_jar_1794770042025.jpg",
    sections: ["shop"],
    stock: 42,
    soldCount: 36,
    extractionMethod: "Mountain Spring Brine",
    acidityLevel: "N/A — Table Olives",
  },
  {
    slug: "shop-10",
    sku: "ZP-VG-518",
    name: "100% Botanical Olive Elixir",
    brand: "Verdant Grove",
    category: "Bottled",
    flavour: "Cardamom",
    origin: "Swat Valley",
    price: 1950,
    rating: 5,
    popularity: 98,
    size: "250 ml Amber Glass",
    description: "UV-shielded amber bottle preserving delicate olive-leaf antioxidants.",
    image: "/assets/images/shop_card_amber_bottle_1794770042120.jpg",
    sections: ["shop", "best-sellers"],
    stock: 38,
    soldCount: 52,
    extractionMethod: "First-Drop Olive Extraction",
    acidityLevel: "< 0.20% Free Fatty Acidity",
  },
  {
    slug: "shop-11",
    sku: "ZP-ZR-519",
    name: "Estate Family Tin 5lt",
    brand: "Zaitoon Reserve",
    category: "Tins 5lt",
    flavour: "Pepper",
    origin: "Mediterranean",
    price: 4950,
    rating: 5,
    isNew: true,
    popularity: 86,
    size: "5 Litre Kitchen Tin",
    description: "Light-proof heritage kitchen tin for households and hospitality kitchens.",
    image: "/assets/images/product_olive_oil_1794763960228.jpg",
    sections: ["shop"],
    stock: 20,
    soldCount: 16,
    extractionMethod: "First Cold-Press (< 27°C), Nitrogen Flushed",
    acidityLevel: "< 0.3% Free Fatty Acidity",
  },
  {
    slug: "shop-12",
    sku: "ZP-HS-520",
    name: "Raw Sidr & Olive Gift Duo",
    brand: "Himalayan Sidr",
    category: "Spill",
    flavour: "Ginger",
    origin: "Mediterranean",
    price: 3400,
    originalPrice: 4100,
    rating: 5,
    isSale: true,
    popularity: 93,
    size: "450 g + 250 ml",
    description: "Wild mountain Sidr honey paired with cold-pressed extra virgin olive oil.",
    image: "/assets/images/product_wild_honey_1794763961239.jpg",
    sections: ["shop"],
    stock: 30,
    soldCount: 44,
    extractionMethod: "Cold Pressed Oil + Raw Unheated Honey",
    acidityLevel: "< 0.3% Oil Acidity",
  },
  {
    slug: "shop-13",
    sku: "ZP-HS-521",
    name: "Wild Himalayan Sidr Raw Honeycomb",
    brand: "Himalayan Sidr",
    category: "Raw Honey",
    flavour: "Cardamom",
    origin: "Swat Valley",
    price: 4200,
    rating: 5,
    isNew: true,
    popularity: 97,
    size: "500 g Comb-in-Jar",
    description: "Hand-cut unheated jujube honeycomb suspended in pure amber Sidr honey.",
    image: "/assets/images/unique_sidr_honeycomb_jar_1794820496427.jpg",
    sections: ["shop"],
    stock: 22,
    soldCount: 49,
    extractionMethod: "Wild Harvest, Raw Unfiltered",
    acidityLevel: "N/A — Pure Mountain Honey",
  },
  {
    slug: "shop-14",
    sku: "ZP-VG-522",
    name: "Sun-Dried Olive Leaf & Highland Tea",
    brand: "Verdant Grove",
    category: "Botanical Infusions",
    flavour: "Basil",
    origin: "Swat Valley",
    price: 1450,
    rating: 5,
    popularity: 89,
    size: "200 g Matte Caddy",
    description: "Shade-dried olive orchard leaves blended with highland lemongrass and wild rosemary.",
    image: "/assets/images/product_herbal_infusion_1794763964623.jpg",
    sections: ["shop"],
    stock: 50,
    soldCount: 28,
    extractionMethod: "Sun-Dried Botanical Blend",
    acidityLevel: "N/A — Herbal Infusion",
  },
  {
    slug: "shop-15",
    sku: "ZP-ZR-523",
    name: "Kashmiri Saffron & Peppercorn Reserve",
    brand: "Zaitoon Reserve",
    category: "Bottled",
    flavour: "Pepper",
    origin: "Potohar",
    price: 3450,
    rating: 5,
    isNew: true,
    popularity: 94,
    size: "350 ml Apothecary",
    description: "Cold-macerated Potohar olive oil infused with Kashmiri saffron stigmas and peppercorns.",
    image: "/assets/images/unique_saffron_olive_elixir_1794820496501.jpg",
    sections: ["shop"],
    stock: 26,
    soldCount: 39,
    extractionMethod: "Cold Macerated Extra Virgin",
    acidityLevel: "< 0.3% Free Fatty Acidity",
  },
];

const COUPONS_DATA = [
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
    code: "OLIVE10",
    description: "10% Harvest Welcome Discount",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 0,
    maxDiscountAmount: 2000,
    usageLimit: null,
    usedCount: 8,
    isActive: true,
  },
  {
    code: "HARVEST500",
    description: "Flat Rs. 500 off on harvest orders above Rs. 4,000",
    discountType: "flat",
    discountValue: 500,
    minOrderAmount: 4000,
    usageLimit: 500,
    usedCount: 21,
    isActive: true,
  },
];

const BLOGS_DATA = [
  {
    slug: "health-benefits-of-olive-oil",
    day: "23",
    month: "Aug",
    title: "Health benefits of olive oil",
    excerpt:
      "Rich in oleic acid and natural polyphenols, cold-pressed extra virgin olive oil supports cardiovascular vitality and everyday cellular protection.",
    readTime: "4 min read",
    image: "/assets/images/blog_harvest_basket_1794769773942.jpg",
    alt: "Farmer hands in canvas gloves sorting freshly harvested green olives in a dark harvest tub",
    content: [
      "Unrefined extra virgin olive oil stands apart from refined cooking oils because its natural micronutrients remain intact. Cold-pressing olives below 27°C preserves monounsaturated oleic acid alongside bioactive polyphenols like oleocanthal and hydroxytyrosol.",
      "Across our Potohar and Chakwal partner groves, olives are harvested while still vibrant green-to-violet—the exact window when antioxidant concentration peaks. Adding two tablespoons daily over salads, cooked lentils, or warm sourdough supports steady metabolic and heart health.",
    ],
    isPublished: true,
  },
  {
    slug: "the-everyday-superfood",
    day: "18",
    month: "Sep",
    title: "The everyday superfood",
    excerpt:
      "From morning drizzles over warm flatbread to crisp garden salads, unrefined olive oil brings orchard-fresh nourishment to everyday Pakistani kitchens.",
    readTime: "3 min read",
    image: "/assets/images/blog_bottle_hands_1794769773474.jpg",
    alt: "Hands holding a corked green glass bottle of extra virgin olive oil over white surface with olives and peppercorns",
    content: [
      "Extra virgin olive oil is often saved strictly for special occasions, yet its stability and high polyphenol content make it ideal for daily cooking, roasting, and finishing.",
      "Try whisking our Chakwal Estate oil with fresh lemon juice, crushed garlic, and mountain Sidr honey for a bright salad dressing, or brushing it lightly over tandoori naan right out of the oven.",
    ],
    isPublished: true,
  },
  {
    slug: "how-is-virgin-certified",
    day: "04",
    month: "Oct",
    title: "How is virgin certified",
    excerpt:
      "Every Zaitoon Pakistan harvest undergoes sensory tasting and laboratory acidity screening below 0.3% before earning extra virgin certification.",
    readTime: "5 min read",
    image: "/assets/images/blog_pruning_grower_1794769773955.jpg",
    alt: "Olive grove grower pruning silvery-green olive branches under a clear blue sky",
    content: [
      "True extra virgin certification requires two distinct benchmarks: zero sensory defects during blind tasting and strict chemical purity verified in the laboratory.",
      "To qualify for Zaitoon Reserve bottling, free fatty acidity must measure well below the international 0.8% threshold—our early-harvest Potohar batches consistently test under 0.3%, with low peroxide values and documented cold-storage traceability.",
    ],
    isPublished: true,
  },
];

async function seed() {
  console.log("=================================================");
  console.log("🌱 STARTING ZAITOON PAKISTAN SEED SCRIPT");
  console.log("=================================================");

  await connectDB();

  // 1. Clear existing e-commerce collections (cleans out old curtain/fashion data)
  console.log("🧹 Clearing old database collections...");
  await Promise.all([
    AdminUser.deleteMany({}),
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
  const adminName = env.ADMIN_BOOTSTRAP.NAME || "Zaitoon Super Admin";

  const hashedPassword = await bcrypt.hash(adminPassword, 12);
  const adminUser = await AdminUser.create({
    name: adminName,
    email: adminEmail,
    password: hashedPassword,
    role: "super_admin",
    isActive: true,
  });
  console.log(`✅ Seeded Super Admin: ${adminUser.email} / ${adminPassword}`);

  // 3. Seed 23 Products
  console.log(`🌿 Seeding ${PRODUCTS_DATA.length} Zaitoon Pakistan products...`);
  const createdProducts = await Product.insertMany(PRODUCTS_DATA);
  console.log(`✅ Seeded ${createdProducts.length} Products successfully.`);

  const productMap = {};
  createdProducts.forEach((p) => {
    productMap[p.slug] = p;
  });

  // 4. Seed Reviews for some products
  const sampleReviews = [
    {
      product: productMap["grid-potohar-classic"]._id,
      author: "Dr. Ayesha Malik (Islamabad)",
      rating: 5,
      comment: "Superb early harvest olive oil with a peppery kick. Exactly what true cold-pressed olive oil should taste like.",
      isApproved: true,
    },
    {
      product: productMap["shop-1"]._id,
      author: "Kashif Rehman (Lahore)",
      rating: 5,
      comment: "Rich natural aroma. Great packaging and fast TCS delivery to Lahore in insulated bottle wraps.",
      isApproved: true,
    },
    {
      product: productMap["unique-sidr-raw-honeycomb"]._id,
      author: "Zainab Bokhari (Karachi)",
      rating: 5,
      comment: "The raw comb inside the Sidr honey is authentic and exquisite. Will order again for gifts.",
      isApproved: true,
    },
  ];
  await Review.insertMany(sampleReviews);
  console.log("✅ Seeded Sample Reviews.");

  // 5. Seed Coupons
  console.log("🎟️ Seeding harvest discount coupons...");
  const createdCoupons = await Coupon.insertMany(COUPONS_DATA);
  console.log(`✅ Seeded ${createdCoupons.length} Coupons.`);

  // 6. Seed Blog Posts
  console.log("📰 Seeding Zaitoon harvest blog posts...");
  const createdBlogs = await BlogPost.insertMany(BLOGS_DATA);
  console.log(`✅ Seeded ${createdBlogs.length} Blog Posts.`);

  // 7. Seed Sample Tracked Orders
  console.log("📦 Seeding sample tracked orders (ZP-1042 & ZP-1088)...");
  const p1 = productMap["shop-2"] || createdProducts[0];
  const p2 = productMap["grid-orchard-olives"] || createdProducts[1];
  const p3 = productMap["shop-1"] || createdProducts[2];
  const p4 = productMap["unique-olive-leaf-lemongrass"] || createdProducts[3];

  const sampleOrders = [
    {
      orderReference: "ZP-1042",
      courierName: "TCS Express",
      courierTrackingCode: "TCS-104290",
      customer: {
        name: "Bilal Tariq",
        phone: "0301-8451290",
        email: "bilal.tariq@gmail.com",
      },
      shippingAddress: {
        city: "Lahore",
        area: "Gulberg III",
        address: "House 42-B, Main Boulevard, Gulberg III",
        notes: "Please call before arriving",
      },
      items: [
        {
          product: p1._id,
          slug: p1.slug,
          name: p1.name,
          size: p1.size,
          image: p1.image,
          price: 2400,
          quantity: 1,
          lineTotal: 2400,
        },
        {
          product: p2._id,
          slug: p2.slug,
          name: p2.name,
          size: p2.size,
          image: p2.image,
          price: 1000,
          quantity: 1,
          lineTotal: 1000,
        },
      ],
      paymentMethod: "Cash on Delivery",
      paymentStatus: "pending_cod",
      subtotal: 3400,
      discountAmount: 0,
      shippingFee: 0,
      total: 3400,
      orderStatus: "dispatched",
      trackingStage: 3,
      statusSummary: "In Transit via TCS Express — Linehaul En Route to Lahore Hub",
      estimatedDelivery: "Tomorrow by 4:00 PM via TCS Express",
      statusHistory: [
        {
          stage: 1,
          orderStatus: "confirmed",
          note: "Order Confirmed — Batch Verified at Islamabad Orchard Hub",
          updatedBy: "System",
          timestamp: new Date(Date.now() - 48 * 3600000),
        },
        {
          stage: 2,
          orderStatus: "cold_packed",
          note: "Cold-Packed & Sealed — Cushioned in dark-glass protective sleeves",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 36 * 3600000),
        },
        {
          stage: 3,
          orderStatus: "dispatched",
          note: "Handed over to TCS Express Islamabad Central Hub (TCS-104290)",
          updatedBy: "Hub Manager",
          timestamp: new Date(Date.now() - 12 * 3600000),
        },
      ],
    },
    {
      orderReference: "ZP-1088",
      courierName: "TCS Express",
      courierTrackingCode: "TCS-108890",
      customer: {
        name: "Hassan Raza",
        phone: "0321-9876543",
        email: "hassan.raza@yahoo.com",
      },
      shippingAddress: {
        city: "Karachi",
        area: "DHA Phase 6",
        address: "Apartment 4B, Creek Vista, Phase 6 DHA",
        notes: "Leave with building reception if unavailable",
      },
      items: [
        {
          product: p3._id,
          slug: p3.slug,
          name: p3.name,
          size: p3.size,
          image: p3.image,
          price: 3900,
          quantity: 1,
          lineTotal: 3900,
        },
        {
          product: p4._id,
          slug: p4.slug,
          name: p4.name,
          size: p4.size,
          image: p4.image,
          price: 950,
          quantity: 1,
          lineTotal: 950,
        },
      ],
      paymentMethod: "Cash on Delivery",
      paymentStatus: "paid",
      subtotal: 4850,
      discountAmount: 0,
      shippingFee: 0,
      total: 4850,
      orderStatus: "delivered",
      trackingStage: 4,
      statusSummary: "Delivered — Signed by recipient Hassan Raza",
      estimatedDelivery: "Delivered on 17 Nov 2026",
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
          note: "Cold-Packed & Sealed in insulated sleeves",
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
  console.log("✅ Seeded Orders ZP-1042 and ZP-1088.");

  // 8. Seed sample inquiry & newsletter subscribers
  await ContactInquiry.create({
    name: "Dr. Farooq Siddiqui",
    contactInfo: "farooq.siddiqui@aku.edu",
    city: "Karachi",
    topic: "Bulk & Corporate Gifting",
    message: "Inquiring about 50 corporate gift boxes of Potohar cold-pressed olive oil & Sidr honey for executive gifting.",
    status: "new",
  });

  await NewsletterSubscriber.insertMany([
    { email: "harvest.patron@gmail.com", source: "Harvest Letter", isActive: true },
    { email: "dr.farooq@aku.edu", source: "Website Footer", isActive: true },
  ]);
  console.log("✅ Seeded Sample Inquiry and Newsletter Subscribers.");

  console.log("=================================================");
  console.log("🎉 ZAITOON PAKISTAN SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=================================================");
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
