import mongoose from 'mongoose';
import BlogPost from '../models/BlogPost.js';

const additionalBlogs = [
  {
    slug: 'cold-pressed-kalonji-black-seed-oil',
    day: '18',
    month: 'Sep',
    title: 'Cold-Pressed Kalonji (Black Seed) Oil: Ancient Thymoquinone Potency',
    excerpt: 'First mechanical cold-pressing of Nigella sativa seeds yields unmatched concentrations of active thymoquinone and healthy fatty acids.',
    readTime: '4 min read',
    image: '/assets/images/blog_bottle_hands_1794769773474.jpg',
    alt: 'Artisan hand bottling golden dark amber cold-pressed oil',
    content: [
      'Kalonji seeds have been treasured for thousands of years across South Asia and the Middle East as a panacea for immune and metabolic vitality.',
      'Our mechanical single-press extraction operates strictly below 27°C, preserving over 1.8% active thymoquinone without chemical deodorization.'
    ],
    isPublished: true
  },
  {
    slug: 'wild-himalayan-sidr-honey-nectar',
    day: '04',
    month: 'Sep',
    title: 'Wild Himalayan Sidr Honey: Nature’s Purest Antimicrobial Golden Nectar',
    excerpt: 'Monofloral nectar harvested from wild Ziziphus lotus blossoms in Karak mountain valleys delivers powerful natural enzymes.',
    readTime: '5 min read',
    image: '/assets/images/hero_banner_raw_honey_1794764573272.jpg',
    alt: 'Artisanal jar of thick golden Sidr honey with honeycomb',
    content: [
      'Pure Sidr honey is celebrated worldwide for its distinct amber hue, low moisture content, and rich enzymatic density.',
      'Never heated or ultra-filtered, Pak Veda Sidr honey retains living bee propolis and pollen grains directly from wild hives.'
    ],
    isPublished: true
  },
  {
    slug: 'stone-ground-spices-essential-volatiles',
    day: '22',
    month: 'Aug',
    title: 'Traditional Stone-Ground Spices vs. High-Speed Industrial Milling',
    excerpt: 'How slow granite stone milling keeps temperatures cool to preserve delicate essential oils, color, and culinary aroma.',
    readTime: '4 min read',
    image: '/assets/images/featured_lifestyle_amber_dispensers_1794821301581.jpg',
    alt: 'Traditional stone mortar with freshly crushed whole aromatic spices',
    content: [
      'High-speed industrial blades generate temperatures up to 80°C, scorching volatile aroma compounds and oxidizing delicate phytonutrients.',
      'Pak Veda employs slow-turning granite chakki mills operating under 35°C to preserve natural piperine, cinnamaldehyde, and essential spice oils.'
    ],
    isPublished: true
  }
];

async function run() {
  await mongoose.connect('mongodb://localhost:27017/zaitoon_pakistan');
  console.log('Connected to MongoDB');

  for (const b of additionalBlogs) {
    const existing = await BlogPost.findOne({ slug: b.slug });
    if (!existing) {
      await BlogPost.create(b);
      console.log('Created blog:', b.title);
    } else {
      console.log('Already exists:', b.title);
    }
  }

  const total = await BlogPost.countDocuments({ isPublished: true });
  console.log('Total published blogs in DB:', total);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
