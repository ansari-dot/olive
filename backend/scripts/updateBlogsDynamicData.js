import mongoose from "mongoose";
import BlogPost from "../models/BlogPost.js";

async function main() {
  await mongoose.connect("mongodb://localhost:27017/zaitoon_pakistan");
  console.log("Connected to MongoDB");

  const updates = [
    {
      slug: "benefits-of-high-curcumin-turmeric",
      category: "Botanical Remedies & Spices",
      author: "Dr. Tariq Bashir",
      year: "2026",
      tags: ["Turmeric", "Curcumin", "Stone-Ground", "Organic Harvest"],
      takeaways: [
        "Stone-milling below 35°C preserves volatile turmerone oils that heat destroyed in factory powders.",
        "Always combine with fresh ground black pepper (piperine) to boost cellular uptake by 2,000%.",
        "Store in an airtight ceramic or amber glass jar away from direct sunlight.",
      ],
      comments: [
        {
          author: "Hina Riaz",
          city: "Lahore",
          comment: "The vibrant color and earthy fragrance are completely unlike supermarket packaged turmeric. Whisked into golden milk every evening with honey.",
          createdAt: new Date("2026-10-15"),
        },
      ],
    },
    {
      slug: "himalayan-shilajit-skardu-purity",
      category: "Himalayan Shilajit & Honey",
      author: "Mirza Ali (Skardu Expedition)",
      year: "2026",
      tags: ["Shilajit", "Skardu", "Fulvic Acid", "Himalayan"],
      takeaways: [
        "Authentic raw pitch dissolves cleanly in warm water or green tea without gritty residue.",
        "Delivers over 75% natural fulvic acid alongside 84 ionic trace minerals.",
        "Use a pea-sized portion (300-500 mg) first thing in the morning on an empty stomach.",
      ],
      comments: [
        {
          author: "Bilal Siddiqui",
          city: "Islamabad",
          comment: "Dissolves cleanly in warm water with zero residue. Real Skardu resin with tremendous sustained energy.",
          createdAt: new Date("2026-10-29"),
        },
      ],
    },
    {
      slug: "early-harvest-potohar-olive-oil",
      category: "Harvest & Extraction",
      author: "Pak Veda Master Miller",
      year: "2026",
      tags: ["Extra Virgin", "Cold-Pressed", "Potohar", "Polyphenols"],
      takeaways: [
        "Early October hand-picked olives yield under 0.22% free fatty acidity.",
        "Mechanical single cold press executed strictly below 27°C within 6 hours of orchard picking.",
        "Keep bottles corked in a dark pantry and consume within 4-6 months of opening.",
      ],
      comments: [
        {
          author: "Dr. Ayesha Malik",
          city: "Islamabad",
          comment: "Superb early harvest olive oil with a distinct peppery throat kick. Exactly what lab-certified cold-pressed olive oil should taste like.",
          createdAt: new Date("2026-10-12"),
        },
      ],
    },
    {
      slug: "cold-pressed-kalonji-black-seed-oil",
      category: "Harvest & Extraction",
      author: "Hakim Noor Ahmad",
      year: "2026",
      tags: ["Cold-Pressed", "Kalonji", "Black Seed", "Thymoquinone"],
      takeaways: [
        "Single-press mechanical virgin extraction yields over 1.8% active thymoquinone.",
        "Zero solvent extraction or chemical refining ensures raw enzymatic potency.",
        "Ideal for morning immune wellness and direct scalp application.",
      ],
      comments: [
        {
          author: "Zainab Bokhari",
          city: "Karachi",
          comment: "Remarkable purity and aroma. The dark glass dispenser protects it from oxidation.",
          createdAt: new Date("2026-09-22"),
        },
      ],
    },
    {
      slug: "wild-himalayan-sidr-honey-nectar",
      category: "Himalayan Shilajit & Honey",
      author: "Syed Qasim Shah",
      year: "2026",
      tags: ["Wild Sidr", "Raw Honey", "Karak", "Antimicrobial"],
      takeaways: [
        "100% monofloral nectar from wild Ziziphus lotus blossoms in high Karak valleys.",
        "Raw, unheated, and unfiltered to retain active living bee propolis and enzymes.",
        "Never refrigerate natural raw honey; keep at ambient room temperature.",
      ],
      comments: [
        {
          author: "Usman Tariq",
          city: "Peshawar",
          comment: "Thick, fragrant, and soothes the throat instantly. Authentic wild Karak Sidr honey.",
          createdAt: new Date("2026-09-08"),
        },
      ],
    },
    {
      slug: "stone-ground-spices-essential-volatiles",
      category: "Botanical Remedies & Spices",
      author: "Pak Veda Culinary Lab",
      year: "2026",
      tags: ["Stone-Ground", "Spices", "Traditional Milling", "Aroma Oils"],
      takeaways: [
        "Granite chakki mills operate at cool revolutions under 35°C to preserve fragrant volatile aromatics.",
        "Industrial high-speed steel blades scorch essential oils and degrade natural vitamins.",
        "Small batch freshly ground weekly for unmatched kitchen vitality and color.",
      ],
      comments: [
        {
          author: "Chef Farhan",
          city: "Lahore",
          comment: "You can immediately smell the difference when tempering in hot ghee. The natural volatile oils are completely intact.",
          createdAt: new Date("2026-08-25"),
        },
      ],
    },
  ];

  for (const u of updates) {
    const res = await BlogPost.updateOne({ slug: u.slug }, { $set: u });
    console.log(`Updated "${u.slug}": matched ${res.matchedCount}, modified ${res.modifiedCount}`);
  }

  console.log("Finished updating blogs!");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Migration error:", err);
  process.exit(1);
});
