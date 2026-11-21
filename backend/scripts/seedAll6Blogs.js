import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import BlogPost from "../models/BlogPost.js";

const ALL_BLOGS = [
  {
    slug: "benefits-of-high-curcumin-turmeric",
    title: "Why High-Curcumin Single-Origin Turmeric Matters",
    day: "12",
    month: "NOV",
    year: "2026",
    author: "Dr. Tariq Bashir",
    category: "Botanical Remedies & Spices",
    tags: ["Turmeric", "Curcumin", "Stone-Ground", "Organic Harvest"],
    readTime: "4 min read",
    excerpt: "Unlike mass-market commercial powders, low-temperature stone-ground Kasur turmeric preserves bioactive volatile curcumins and essential oils.",
    image: "/assets/images/blog_harvest_basket_1794769773942.jpg",
    alt: "Farmer sorting freshly harvested golden turmeric rhizomes",
    content: [
      "Natural turmeric contains curcuminoids—primarily curcumin—which are potent natural anti-inflammatory compounds.",
      "Most commercial brands use high-speed hammer mills exceeding 75°C, boiling away valuable volatile turmerones. Pak Veda harvests Kasur rhizomes with tested curcumin above 5.8% and stone-mills below 35°C."
    ],
    takeaways: [
      "Stone-milling below 35°C preserves volatile turmerone oils that heat destroyed in factory powders.",
      "Always combine with fresh ground black pepper (piperine) to boost cellular uptake by 2,000%.",
      "Store in an airtight ceramic or amber glass jar away from direct sunlight."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Hina Riaz",
        city: "Lahore",
        comment: "The vibrant color and earthy fragrance are completely unlike supermarket packaged turmeric. Whisked into golden milk every evening with honey.",
        createdAt: new Date("2026-10-15")
      }
    ]
  },
  {
    slug: "himalayan-shilajit-skardu-purity",
    title: "Harvesting Karakoram Gold: The Ancient Purity of Skardu Shilajit",
    day: "28",
    month: "OCT",
    year: "2026",
    author: "Mirza Ali (Skardu Expedition)",
    category: "Himalayan Shilajit & Honey",
    tags: ["Shilajit", "Skardu", "Fulvic Acid", "Himalayan"],
    readTime: "5 min read",
    excerpt: "From vertical cliffs above 16,000 feet, raw mineral pitch is hand-gathered and sun-purified to deliver over 75% bio-active fulvic acid.",
    image: "/assets/images/unique_saffron_olive_elixir_1794820496501.jpg",
    alt: "Black mineral resin dripping slowly onto white quartz",
    content: [
      "For centuries, high-altitude villagers across Baltistan have gathered raw Shilajit exuding from rock crevices during warm summer months.",
      "Pak Veda partners with certified high-altitude foragers in Skardu. The raw resin is purified through multiple solar-filtered water baths, preserving its delicate fulvic and humic complex without charcoal charring or chemical solvent extraction."
    ],
    takeaways: [
      "Authentic raw pitch dissolves cleanly in warm water or green tea without gritty residue.",
      "Delivers over 75% natural fulvic acid alongside 84 ionic trace minerals.",
      "Use a pea-sized portion (300-500 mg) first thing in the morning on an empty stomach."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Bilal Siddiqui",
        city: "Islamabad",
        comment: "Dissolves cleanly in warm water with zero residue. Real Skardu resin with tremendous sustained energy.",
        createdAt: new Date("2026-10-29")
      }
    ]
  },
  {
    slug: "early-harvest-potohar-olive-oil",
    title: "Potohar Olive Renaissance: Early Harvest Extra Virgin Certification",
    day: "04",
    month: "OCT",
    year: "2026",
    author: "Pak Veda Master Miller",
    category: "Harvest & Extraction",
    tags: ["Extra Virgin", "Cold-Pressed", "Potohar", "Polyphenols"],
    readTime: "5 min read",
    excerpt: "Every Pak Veda olive harvest undergoes laboratory acidity testing below 0.25% and sensory tasting before earning extra virgin bottling.",
    image: "/assets/images/blog_pruning_grower_1794769773955.jpg",
    alt: "Olive grove grower pruning silvery-green olive branches under a clear blue sky",
    content: [
      "True extra virgin certification requires zero sensory defects and chemical purity verified in the laboratory. Our orchards across the Chakwal plateaus benefit from kalk soil and sharp diurnal temperature swings.",
      "Olives are hand-picked at dawn at peak green-turning stage and cold-extracted within 4 hours using state-of-the-art continuous centrifugal decanters strictly maintained under 24°C."
    ],
    takeaways: [
      "Early October hand-picked olives yield under 0.22% free fatty acidity.",
      "Mechanical single cold press executed strictly below 27°C within 6 hours of orchard picking.",
      "Keep bottles corked in a dark pantry and consume within 4-6 months of opening."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Dr. Ayesha Malik",
        city: "Islamabad",
        comment: "Superb early harvest olive oil with a distinct peppery throat kick. Exactly what lab-certified cold-pressed olive oil should taste like.",
        createdAt: new Date("2026-10-12")
      }
    ]
  },
  {
    slug: "cold-pressed-kalonji-black-seed-oil",
    title: "Cold-Pressed Kalonji (Black Seed) Oil: Ancient Thymoquinone Potency",
    day: "18",
    month: "SEP",
    year: "2026",
    author: "Hakim Noor Ahmad",
    category: "Harvest & Extraction",
    tags: ["Cold-Pressed", "Kalonji", "Black Seed", "Thymoquinone"],
    readTime: "4 min read",
    excerpt: "First mechanical cold-pressing of Nigella sativa seeds yields unmatched concentrations of active thymoquinone and healthy fatty acids.",
    image: "/assets/images/blog_bottle_hands_1794769773474.jpg",
    alt: "Artisan hand bottling golden dark amber cold-pressed oil",
    content: [
      "Kalonji seeds have been treasured for thousands of years as a panacea for immune and metabolic vitality across traditional eastern pharmacopeias.",
      "Our mechanical single-press extraction operates strictly below 27°C, preserving over 1.8% active thymoquinone without chemical deodorization or hexane washing."
    ],
    takeaways: [
      "Single-press mechanical virgin extraction yields over 1.8% active thymoquinone.",
      "Zero solvent extraction or chemical refining ensures raw enzymatic potency.",
      "Ideal for morning immune wellness and direct scalp application."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Zainab Bokhari",
        city: "Karachi",
        comment: "Remarkable purity and aroma. The dark glass dispenser protects it from oxidation.",
        createdAt: new Date("2026-09-22")
      }
    ]
  },
  {
    slug: "wild-himalayan-sidr-honey-nectar",
    title: "Wild Himalayan Sidr Honey: Nature’s Purest Antimicrobial Golden Nectar",
    day: "04",
    month: "SEP",
    year: "2026",
    author: "Syed Qasim Shah",
    category: "Himalayan Shilajit & Honey",
    tags: ["Wild Sidr", "Raw Honey", "Karak", "Antimicrobial"],
    readTime: "5 min read",
    excerpt: "Monofloral nectar harvested from wild Ziziphus lotus blossoms in Karak mountain valleys delivers powerful natural enzymes.",
    image: "/assets/images/hero_banner_raw_honey_1794764573272.jpg",
    alt: "Artisanal jar of thick golden Sidr honey with honeycomb",
    content: [
      "Pure Sidr honey is celebrated worldwide for its distinct amber hue, low moisture content, and rich enzymatic density.",
      "Never heated or ultra-filtered, Pak Veda Sidr honey retains living bee propolis and pollen grains directly from wild hives in the Karak valleys."
    ],
    takeaways: [
      "100% monofloral nectar from wild Ziziphus lotus blossoms in high Karak valleys.",
      "Raw, unheated, and unfiltered to retain active living bee propolis and enzymes.",
      "Never refrigerate natural raw honey; keep at ambient room temperature."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Usman Tariq",
        city: "Peshawar",
        comment: "Thick, fragrant, and soothes the throat instantly. Authentic wild Karak Sidr honey.",
        createdAt: new Date("2026-09-08")
      }
    ]
  },
  {
    slug: "stone-ground-spices-essential-volatiles",
    title: "Traditional Stone-Ground Spices vs. High-Speed Industrial Milling",
    day: "22",
    month: "AUG",
    year: "2026",
    author: "Pak Veda Culinary Lab",
    category: "Botanical Remedies & Spices",
    tags: ["Stone-Ground", "Spices", "Traditional Milling", "Aroma Oils"],
    readTime: "4 min read",
    excerpt: "How slow granite stone milling keeps temperatures cool to preserve delicate essential oils, color, and culinary aroma.",
    image: "/assets/images/featured_lifestyle_amber_dispensers_1794821301581.jpg",
    alt: "Traditional stone mortar with freshly crushed whole aromatic spices",
    content: [
      "High-speed industrial blades generate temperatures up to 80°C, scorching volatile aroma compounds and oxidizing delicate phytonutrients.",
      "Pak Veda employs slow-turning granite chakki mills operating under 35°C to preserve natural piperine, cinnamaldehyde, and essential spice oils."
    ],
    takeaways: [
      "Granite chakki mills operate at cool revolutions under 35°C to preserve fragrant volatile aromatics.",
      "Industrial high-speed steel blades scorch essential oils and degrade natural vitamins.",
      "Small batch freshly ground weekly for unmatched kitchen vitality and color."
    ],
    isPopular: true,
    isPublished: true,
    comments: [
      {
        author: "Chef Farhan",
        city: "Lahore",
        comment: "You can immediately smell the difference when tempering in hot ghee. The natural volatile oils are completely intact.",
        createdAt: new Date("2026-08-25")
      }
    ]
  }
];

async function seed() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB:", mongoUri);

  for (const b of ALL_BLOGS) {
    const existing = await BlogPost.findOne({ slug: b.slug });
    if (existing) {
      await BlogPost.updateOne({ slug: b.slug }, { $set: b });
      console.log(`Updated existing post: ${b.title} (isPopular: ${b.isPopular})`);
    } else {
      await BlogPost.create(b);
      console.log(`Created new post: ${b.title} (isPopular: ${b.isPopular})`);
    }
  }

  const allInDb = await BlogPost.find({}, "title slug isPopular isPublished comments");
  console.log(`Total blogs in DB: ${allInDb.length}`);
  console.table(allInDb.map((p) => ({
    title: p.title.slice(0, 30) + '...',
    slug: p.slug,
    isPopular: p.isPopular,
    isPublished: p.isPublished,
    commentsCount: p.comments?.length || 0,
  })));

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});
