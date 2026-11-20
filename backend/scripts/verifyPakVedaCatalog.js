import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Category from '../models/Category.js';
import Product from '../models/Product.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/zaitoon_pakistan';

async function verify() {
  console.log('========================================================');
  console.log('🌿 PAK VEDA CATALOG & CLASSIFICATION AUDIT VERIFICATION');
  console.log('========================================================\n');

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB:', MONGO_URI);

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, extraInfo = '') {
    if (condition) {
      console.log(`✅ [PASS] ${testName} ${extraInfo}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName} ${extraInfo}`);
      failed++;
    }
  }

  try {
    // 1. Verify 28 Categories
    const categories = await Category.find({}).sort({ categoryNumber: 1 });
    assert(categories.length === 28, 'Total Categories Count', `Found: ${categories.length}/28`);

    const categoryNumbers = categories.map((c) => c.categoryNumber);
    const expectedNumbers = Array.from({ length: 28 }, (_, i) => i + 1);
    assert(
      JSON.stringify(categoryNumbers) === JSON.stringify(expectedNumbers),
      'Sequential Category Numbers 1 to 28',
      `Numbers: ${categoryNumbers[0]} to ${categoryNumbers[categoryNumbers.length - 1]}`
    );

    // Verify departments
    const departments = [...new Set(categories.map((c) => c.department))];
    assert(departments.length === 7, 'All 7 Master Departments Mapped', `Departments: ${departments.join(', ')}`);

    // Verify subcategories exist on every category
    const allHaveSubcats = categories.every((c) => Array.isArray(c.subcategories) && c.subcategories.length > 0);
    assert(allHaveSubcats, 'All 28 Categories have at least one defined Subcategory');

    // 2. Verify Products
    const products = await Product.find({});
    assert(products.length >= 52, 'Products Loaded in MongoDB', `Count: ${products.length}`);

    // Rule 1: All olive-related products in Category 5 (Olive Products)
    const oliveProducts = products.filter((p) =>
      /olive/i.test(p.name) || /evoo/i.test(p.name) || /tapenade/i.test(p.name)
    );
    const allOlivesInCat5 = oliveProducts.every((p) => p.category === 'Olive Products');
    assert(
      allOlivesInCat5,
      'Classification Rule 1: All Olive items classified under Category 5 (Olive Products)',
      `Olive items checked: ${oliveProducts.length}`
    );

    // Rule 2: All mushroom products in Category 8 (Mushrooms and Mushroom Products)
    const mushroomProducts = products.filter((p) =>
      /mushroom|shiitake|oyster|lion's mane|reishi|cordyceps|chaga/i.test(p.name)
    );
    const allMushroomsInCat8 = mushroomProducts.every((p) => p.category === 'Mushrooms and Mushroom Products');
    assert(
      allMushroomsInCat8,
      'Classification Rule 2: All Mushrooms (culinary, powders, extracts, supplements, coffee) under Cat 8',
      `Mushroom items checked: ${mushroomProducts.length}`
    );

    // Rule 3: Shilajit in Category 9 (Extracts and Concentrates)
    const shilajitProducts = products.filter((p) => /shilajit/i.test(p.name));
    const allShilajitInCat9 = shilajitProducts.every((p) => p.category === 'Extracts and Concentrates');
    assert(
      allShilajitInCat9,
      'Classification Rule 3: Shilajit placed exclusively under Category 9 (Extracts and Concentrates)',
      `Shilajit items checked: ${shilajitProducts.length}`
    );

    // Rule 4: Superfood Powders in Category 15 (Superfoods and Functional Ingredients)
    const superfoodProducts = products.filter((p) => p.category === 'Superfoods and Functional Ingredients');
    assert(
      superfoodProducts.length > 0 && superfoodProducts.some((p) => /moringa|chia|cacao/i.test(p.name)),
      'Classification Rule 4: Superfood ingredients in Category 15',
      `Superfood count: ${superfoodProducts.length}`
    );

    // Rule 5: Single primary category per product
    const validPrimaryCategories = categories.map((c) => c.name);
    const allProductsHaveValidSingleCat = products.every(
      (p) => typeof p.category === 'string' && validPrimaryCategories.includes(p.category)
    );
    assert(
      allProductsHaveValidSingleCat,
      'Classification Rule 5: Every product has exactly one valid primary Category from the 28 Categories'
    );

    // Rule 6: Subcategory queries
    const evooProducts = await Product.find({
      category: 'Olive Products',
      subcategory: 'Early Harvest Extra Virgin Olive Oil (EVOO)',
    });
    assert(
      evooProducts.length > 0,
      'Subcategory Compound Query: Category + Subcategory query returns matches',
      `Found: ${evooProducts.length}`
    );

    console.log('\n========================================================');
    console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('========================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (err) {
    console.error('Audit Error:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

verify();
