import mongoose from "mongoose";
import dotenv from "dotenv";
import Product from "../models/Product.js";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/zaitoon_pakistan";

async function enrichProducts() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB:", MONGODB_URI);

  const products = await Product.find();
  console.log(`Found ${products.length} products to check and enrich...`);

  let updatedCount = 0;
  for (const prod of products) {
    let modified = false;

    if (!prod.harvestSeason) {
      prod.harvestSeason = "Early Harvest 2026";
      modified = true;
    }
    if (!prod.polyphenolCount) {
      prod.polyphenolCount = "450 mg/kg High Phenolic";
      modified = true;
    }
    if (!prod.ingredients) {
      prod.ingredients = "100% Single-Estate Cold-Pressed Extra Virgin Olive Oil";
      modified = true;
    }
    if (!prod.usageDirections) {
      prod.usageDirections = "Ideal as a raw finishing drizzle over fresh salads, warm flatbread, and slow-simmered dishes. Take 1 tablespoon daily.";
      modified = true;
    }
    if (!prod.storageInstructions) {
      prod.storageInstructions = "Store in a cool, dark pantry away from direct heat and light. Keep bottle tightly sealed.";
      modified = true;
    }
    if (!prod.bestBefore) {
      prod.bestBefore = "24 Months from Harvest Date";
      modified = true;
    }
    if (!prod.certifications) {
      prod.certifications = "100% Organic, Cold-Pressed Below 27°C, Zero Solvents, PCSIR Tested";
      modified = true;
    }
    if (!prod.pairingNotes) {
      prod.pairingNotes = "Pairs beautifully with heirloom salads, sourdough bread, roasted vegetables, and grilled meats.";
      modified = true;
    }

    // Set first 2 products as active deals so the user can test the deal module immediately
    if (updatedCount < 2 && !prod.dealBadge) {
      prod.isDeal = true;
      prod.dealBadge = "Deal of the Week · 20% OFF";
      const twoDaysLater = new Date();
      twoDaysLater.setDate(twoDaysLater.getDate() + 2);
      twoDaysLater.setHours(18, 0, 0, 0);
      prod.dealEndsAt = twoDaysLater;
      modified = true;
    }

    if (modified) {
      await prod.save();
      updatedCount++;
    }
  }

  console.log(`Successfully enriched ${updatedCount} products with quality specs, usage guide, and deal attributes!`);
  await mongoose.disconnect();
}

enrichProducts().catch((err) => {
  console.error("Enrichment failed:", err);
  process.exit(1);
});
