import mongoose from 'mongoose';
import Origin from '../models/Origin.js';
import Product from '../models/Product.js';

const initialOrigins = [
  {
    name: 'Potohar',
    region: 'Punjab Olive Belt',
    description: 'Ancient limestone slopes and olive grove terraces ideal for early-harvest Koroneiki olives.'
  },
  {
    name: 'Chakwal',
    region: 'Potohar Plateau',
    description: 'Center of Pakistan olive oil production with traditional cold-press mills and stone-crushers.'
  },
  {
    name: 'Swat',
    region: 'Khyber Pakhtunkhwa',
    description: 'High alpine valleys with mineral-rich glacial meltwater for wild botanicals and Sidr trees.'
  },
  {
    name: 'Gilgit-Baltistan',
    region: 'Karakoram Range',
    description: 'Pristine 16,000+ ft peaks where pure Himalayan Shilajit resin and mountain herbs are hand-gathered.'
  },
  {
    name: 'Kasur',
    region: 'Central Punjab',
    description: 'Historic spice capital renowned for fertile alluvial soils yielding high-curcumin Kasuri turmeric.'
  },
  {
    name: 'Karak',
    region: 'Southern KP',
    description: 'Wild arid hills covered in dense wild Sidr (Jujube/Beri) forests producing raw medicinal honeys.'
  },
  {
    name: 'Hunza',
    region: 'Northern Highlands',
    description: 'High-altitude organic orchards producing apricot kernel oil, dried wild mulberries, and walnuts.'
  },
  {
    name: 'Skardu',
    region: 'Baltistan Valley',
    description: 'Glacial valley famous for organic sea buckthorn berries, high-altitude honey, and botanical herbs.'
  }
];

async function seed() {
  await mongoose.connect('mongodb://localhost:27017/zaitoon_pakistan');
  console.log('Connected to MongoDB');

  for (const item of initialOrigins) {
    const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = await Origin.findOne({ name: item.name });
    if (!existing) {
      await Origin.create({ ...item, slug });
      console.log('Created origin:', item.name);
    } else {
      console.log('Origin already exists:', item.name);
    }
  }

  // Update product counts
  const counts = await Product.aggregate([
    { $match: { isActive: true, origin: { $exists: true, $ne: null } } },
    { $group: { _id: "$origin", count: { $sum: 1 } } }
  ]);
  for (const c of counts) {
    await Origin.updateOne({ name: c._id }, { $set: { count: c.count } });
  }

  const total = await Origin.countDocuments();
  console.log('Total origins in DB:', total);
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
