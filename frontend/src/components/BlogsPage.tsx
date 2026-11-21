import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  ChevronRight,
  User,
  Calendar,
  Loader2,
  Tag,
  ArrowRight,
} from 'lucide-react';
import { BlogPost } from '../data/storeData';
import { fetchBlogs } from '../services/api';

interface BlogsPageProps {
  posts?: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

// Fallback baseline blog posts matching Pak Veda portfolio
const FALLBACK_BLOGS: BlogPost[] = [
  {
    id: 'fb-1',
    slug: 'benefits-of-high-curcumin-turmeric',
    day: '12',
    month: 'Nov',
    title: 'Why High-Curcumin Single-Origin Turmeric Matters',
    excerpt:
      'Unlike mass-market commercial powders, low-temperature stone-ground Kasur turmeric preserves bioactive volatile curcumins and essential oils.',
    readTime: '4 min read',
    image: '/assets/images/blog_harvest_basket_1794769773942.jpg',
    alt: 'Farmer sorting freshly harvested golden turmeric rhizomes',
    content: [
      'Natural turmeric contains curcuminoids—primarily curcumin—which are potent natural anti-inflammatory compounds.',
    ],
  },
  {
    id: 'fb-2',
    slug: 'himalayan-shilajit-skardu-purity',
    day: '28',
    month: 'Oct',
    title: 'Harvesting Karakoram Gold: The Ancient Purity of Skardu Shilajit',
    excerpt:
      'From vertical cliffs above 16,000 feet, raw mineral pitch is hand-gathered and sun-purified to deliver over 75% bio-active fulvic acid.',
    readTime: '5 min read',
    image: '/assets/images/unique_saffron_olive_elixir_1794820496501.jpg',
    alt: 'Black mineral resin dripping slowly onto white quartz',
    content: [
      'For centuries, high-altitude villagers across Baltistan have gathered raw Shilajit exuding from rock crevices.',
    ],
  },
  {
    id: 'fb-3',
    slug: 'early-harvest-potohar-olive-oil',
    day: '04',
    month: 'Oct',
    title: 'Potohar Olive Renaissance: Early Harvest Extra Virgin Certification',
    excerpt:
      'Every Pak Veda olive harvest undergoes laboratory acidity testing below 0.25% and sensory tasting before earning extra virgin bottling.',
    readTime: '5 min read',
    image: '/assets/images/blog_pruning_grower_1794769773955.jpg',
    alt: 'Olive grove grower pruning silvery-green olive branches under a clear blue sky',
    content: [
      'True extra virgin certification requires zero sensory defects and chemical purity verified in the laboratory.',
    ],
  },
  {
    id: 'fb-4',
    slug: 'cold-pressed-kalonji-black-seed-oil',
    day: '18',
    month: 'Sep',
    title: 'Cold-Pressed Kalonji (Black Seed) Oil: Ancient Thymoquinone Potency',
    excerpt:
      'First mechanical cold-pressing of Nigella sativa seeds yields unmatched concentrations of active thymoquinone and healthy fatty acids.',
    readTime: '4 min read',
    image: '/assets/images/blog_bottle_hands_1794769773474.jpg',
    alt: 'Artisan hand bottling golden dark amber cold-pressed oil',
    content: [
      'Kalonji seeds have been treasured for thousands of years as a panacea for immune and metabolic vitality.',
    ],
  },
  {
    id: 'fb-5',
    slug: 'wild-himalayan-sidr-honey-nectar',
    day: '04',
    month: 'Sep',
    title: 'Wild Himalayan Sidr Honey: Nature’s Purest Antimicrobial Golden Nectar',
    excerpt:
      'Monofloral nectar harvested from wild Ziziphus lotus blossoms in Karak mountain valleys delivers powerful natural enzymes.',
    readTime: '5 min read',
    image: '/assets/images/hero_banner_raw_honey_1794764573272.jpg',
    alt: 'Artisanal jar of thick golden Sidr honey with honeycomb',
    content: [
      'Pure Sidr honey is celebrated worldwide for its distinct amber hue and rich enzymatic density.',
    ],
  },
  {
    id: 'fb-6',
    slug: 'stone-ground-spices-essential-volatiles',
    day: '22',
    month: 'Aug',
    title: 'Traditional Stone-Ground Spices vs. High-Speed Industrial Milling',
    excerpt:
      'How slow granite stone milling keeps temperatures cool to preserve delicate essential oils, color, and culinary aroma.',
    readTime: '4 min read',
    image: '/assets/images/featured_lifestyle_amber_dispensers_1794821301581.jpg',
    alt: 'Traditional stone mortar with freshly crushed whole aromatic spices',
    content: [
      'Pak Veda employs slow-turning granite chakki mills operating under 35°C to preserve natural piperine and essential oils.',
    ],
  },
];

const CATEGORIES = [
  'Harvest & Extraction',
  'Olive Oil & Culinary',
  'Himalayan Shilajit & Honey',
  'Orchard News & Potohar',
  'Botanical Remedies & Spices',
];

const POPULAR_TAGS = [
  'Extra Virgin',
  'Cold-Pressed',
  'Shilajit',
  'Wild Sidr',
  'Potohar',
  'Swat Valley',
  'Polyphenols',
  'Ayurveda',
  'Stone-Ground',
  'Organic Harvest',
];

export const BlogsPage: React.FC<BlogsPageProps> = ({
  posts: initialPosts = [],
  onSelectPost,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(
    initialPosts.length > 0 ? initialPosts : []
  );
  const [loading, setLoading] = useState<boolean>(initialPosts.length === 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let isMounted = true;
    fetchBlogs({ forceFresh: true })
      .then((data) => {
        if (isMounted) {
          if (data && data.length > 0) {
            setPosts(data);
          } else if (initialPosts.length > 0) {
            setPosts(initialPosts);
          } else {
            setPosts(FALLBACK_BLOGS);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err);
        if (isMounted && posts.length === 0) {
          setPosts(initialPosts.length > 0 ? initialPosts : FALLBACK_BLOGS);
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Dynamically derive distinct categories from actual published blogs
  const dynamicCategories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    if (set.size === 0) {
      CATEGORIES.forEach((c) => set.add(c));
    }
    return Array.from(set);
  }, [posts]);

  // Dynamically derive distinct tags from actual published blogs
  const dynamicTags = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        if (t && t.trim()) set.add(t.trim());
      });
    });
    if (set.size === 0) {
      POPULAR_TAGS.forEach((t) => set.add(t));
    }
    return Array.from(set);
  }, [posts]);

  // Filter posts based on search, category, and tag
  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        (post.author && post.author.toLowerCase().includes(q)) ||
        (post.category && post.category.toLowerCase().includes(q)) ||
        (post.tags && post.tags.some((t) => t.toLowerCase().includes(q))) ||
        (post.content || []).some((para) => para.toLowerCase().includes(q));

      const matchesCategory =
        selectedCategory === 'All' ||
        (post.category && post.category.toLowerCase() === selectedCategory.toLowerCase()) ||
        post.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(selectedCategory.toLowerCase());

      const matchesTag =
        selectedTag === 'All' ||
        (post.tags && post.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) ||
        post.title.toLowerCase().includes(selectedTag.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(selectedTag.toLowerCase());

      return matchesSearch && matchesCategory && matchesTag;
    });
  }, [posts, searchQuery, selectedCategory, selectedTag]);

  const ITEMS_PER_PAGE = 6;
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE));
  const paginatedPosts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPosts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPosts, currentPage]);

  // Dynamic Popular Posts: Only show posts marked as popular in Admin Panel (or fallback to recent)
  const popularPosts = useMemo(() => {
    const popularOnly = posts.filter((p) => p.isPopular);
    if (popularOnly.length > 0) {
      return popularOnly;
    }
    return posts;
  }, [posts]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setSelectedTag('All');
    setCurrentPage(1);
  };

  return (
    <main className="w-full bg-white text-[#333333] font-sans antialiased">
      {/* =========================================================================
          1. BREADCRUMBS ROW (Exact match: Home > News with divider border)
          ========================================================================= */}
      <div className="w-full border-b border-[#EEEEEE] bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#15472B] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-2 text-[#CCCCCC] select-none" aria-hidden="true">
            &gt;
          </span>
          <span className="text-[#15472B] font-semibold tracking-wide">
            News
          </span>
        </div>
      </div>

      {/* =========================================================================
          2. MAIN CONTENT AREA: 2-COLUMN GRID (Articles Grid Left, Sidebar Right)
          ========================================================================= */}
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* =====================================================================
              LEFT COLUMN (col-span-8): 2-Column Grid of 6 Blog Cards
              ===================================================================== */}
          <div className="lg:col-span-8 xl:col-span-8">
            {/* Active filter notification if any */}
            {(selectedCategory !== 'All' || selectedTag !== 'All' || searchQuery) && (
              <div className="mb-6 pb-4 border-b border-[#EEEEEE] flex items-center justify-between text-xs text-[#666666]">
                <span>
                  Showing results for:{' '}
                  <strong className="text-[#15472B]">
                    {searchQuery
                      ? `"${searchQuery}"`
                      : selectedCategory !== 'All'
                      ? selectedCategory
                      : selectedTag}
                  </strong>{' '}
                  ({filteredPosts.length} stories)
                </span>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[#15472B] font-semibold hover:underline cursor-pointer"
                >
                  Clear filter &times;
                </button>
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-10">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="animate-pulse flex flex-col">
                    <div className="aspect-[16/11] w-full bg-[#F2EFE9]" />
                    <div className="mt-4 space-y-2">
                      <div className="h-5 bg-[#EAE6DF] w-3/4" />
                      <div className="h-3 bg-[#EAE6DF] w-1/2" />
                      <div className="h-3 bg-[#EAE6DF] w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="py-16 text-center border border-[#EEEEEE] bg-[#FAF9F6] p-8">
                <p className="text-[15px] font-medium text-[#444444] mb-2">
                  No articles found matching your criteria.
                </p>
                <p className="text-[13px] text-[#777777] mb-5">
                  Try searching with different terms or reset your filters.
                </p>
                <button
                  type="button"
                  onClick={clearFilters}
                  className="bg-[#15472B] text-white text-[11.5px] font-bold uppercase tracking-wider px-6 py-2.5 rounded cursor-pointer"
                >
                  View All Stories
                </button>
              </div>
            ) : (
              /* 2-Column Article Grid (Exact Reference Match) */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-7 gap-y-12">
                {paginatedPosts.map((post) => {
                  const isBroken = brokenImages[post.id];
                  return (
                    <article key={post.id || post.slug} className="group flex flex-col">
                      {/* Featured Thumbnail */}
                      <div
                        onClick={() => onSelectPost(post)}
                        className="relative aspect-[16/11] w-full bg-[#F5F5F5] overflow-hidden cursor-pointer"
                      >
                        {!isBroken ? (
                          <img
                            src={post.image}
                            alt={post.alt || post.title}
                            onError={() =>
                              setBrokenImages((prev) => ({ ...prev, [post.id]: true }))
                            }
                            className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B] bg-[#FAF8F5]">
                            <span className="font-serif text-base font-semibold">
                              {post.title}
                            </span>
                          </div>
                        )}
                        {post.category && (
                          <div className="absolute top-3 right-3 bg-[#15472B]/90 text-white text-[10.5px] font-semibold tracking-wide uppercase px-2.5 py-1 backdrop-blur-xs">
                            {post.category}
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h2 className="mt-4">
                        <button
                          type="button"
                          onClick={() => onSelectPost(post)}
                          className="font-bold text-[18px] sm:text-[19px] text-[#1F1F1F] group-hover:text-[#15472B] transition-colors leading-snug line-clamp-2 text-left cursor-pointer"
                        >
                          {post.title}
                        </button>
                      </h2>

                      {/* Metadata Row: User Author — Calendar Date */}
                      <div className="flex items-center gap-2 text-[12px] text-[#888888] mt-2 mb-2.5">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 stroke-[2] text-[#888888]" />
                          <span>{post.author || 'Pak Veda'}</span>
                        </span>
                        <span className="text-[#CCCCCC] select-none">—</span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 stroke-[2] text-[#888888]" />
                          <span>
                            {post.month} {post.day}, {post.year || '2026'}
                          </span>
                        </span>
                      </div>

                      {/* Excerpt */}
                      <p className="text-[13.5px] leading-[1.68] text-[#666666] line-clamp-2 mb-4">
                        {post.excerpt}
                      </p>

                      {/* Solid READ MORE Button (Exact Reference Match, Brand Green Color) */}
                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectPost(post)}
                          className="bg-[#15472B] hover:bg-[#0D2F1C] text-white text-[11.5px] font-bold uppercase tracking-[0.1em] px-6 py-2.5 inline-block transition-colors duration-200 shadow-sm cursor-pointer"
                        >
                          READ MORE
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-start gap-2 mt-12 pt-6 border-t border-[#EEEEEE]">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`w-9 h-9 flex items-center justify-center text-[12px] font-bold border transition-colors cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-[#15472B] text-white border-[#15472B]'
                        : 'bg-white text-[#666666] border-[#E5E5E5] hover:border-[#15472B]'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                {currentPage < totalPages && (
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                    className="w-9 h-9 flex items-center justify-center text-[12px] font-bold border bg-white text-[#666666] border-[#E5E5E5] hover:border-[#15472B] transition-colors cursor-pointer"
                    aria-label="Next page"
                  >
                    &gt;
                  </button>
                )}
              </div>
            )}
          </div>

          {/* =====================================================================
              RIGHT SIDEBAR (col-span-4): Search, Categories, Popular Posts, Tags
              ===================================================================== */}
          <aside className="lg:col-span-4 xl:col-span-4 space-y-8">
            {/* Widget 1: Search Form (Input + Brand Green Square Submit Button) */}
            <div>
              <form onSubmit={handleSearchSubmit} className="flex items-center w-full">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search our blog..."
                  className="w-full h-[42px] border border-r-0 border-[#E5E5E5] px-3.5 text-[13px] text-[#333333] placeholder-[#999999] bg-white focus:outline-none focus:border-[#15472B]"
                />
                <button
                  type="submit"
                  aria-label="Search articles"
                  className="h-[42px] w-[46px] bg-[#15472B] hover:bg-[#0D2F1C] text-white flex items-center justify-center transition-colors shrink-0 cursor-pointer"
                >
                  <Search className="w-4 h-4 stroke-[2.2]" />
                </button>
              </form>
            </div>

            {/* Widget 2: CATEGORIES (Header + Accent Underline + > List) */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-2.5">
                Categories
              </h3>
              {/* Header underline with left brand green accent line */}
              <div className="relative w-full h-[1.5px] bg-[#EEEEEE] mb-4" aria-hidden="true">
                <div className="absolute left-0 top-0 w-12 h-[2px] bg-[#15472B]" />
              </div>

              <ul className="space-y-1.5 text-[13px]">
                {dynamicCategories.map((cat) => {
                  const isActive = selectedCategory === cat;
                  return (
                    <li key={cat}>
                      <button
                        type="button"
                        onClick={() => setSelectedCategory(isActive ? 'All' : cat)}
                        className={`flex items-center gap-2 w-full text-left py-1 transition-all cursor-pointer ${
                          isActive
                            ? 'text-[#15472B] font-bold translate-x-1'
                            : 'text-[#666666] hover:text-[#15472B] hover:translate-x-1'
                        }`}
                      >
                        <ChevronRight className="w-3.5 h-3.5 stroke-[2] text-[#AAAAAA] shrink-0" />
                        <span>{cat}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Widget 3: POPULAR POST (Header + Accent Underline + 6 Compact Cards) */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-2.5">
                Popular Post
              </h3>
              <div className="relative w-full h-[1.5px] bg-[#EEEEEE] mb-4" aria-hidden="true">
                <div className="absolute left-0 top-0 w-12 h-[2px] bg-[#15472B]" />
              </div>

              <div className="space-y-3.5">
                {popularPosts.slice(0, 6).map((item) => (
                  <div
                    key={item.id || item.slug}
                    onClick={() => onSelectPost(item)}
                    className="flex items-center gap-3.5 group cursor-pointer"
                  >
                    {/* Small Square Thumbnail */}
                    <div className="w-[68px] h-[64px] shrink-0 bg-[#F5F5F5] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>

                    {/* Compact Title & Date */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[12.5px] text-[#222222] group-hover:text-[#15472B] transition-colors line-clamp-2 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-[#999999] mt-1">
                        {item.month} {item.day}, {item.year || '2026'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Widget 4: ARTICLES TAGS (Header + Accent Underline + Tag Badges) */}
            <div>
              <h3 className="text-[14px] sm:text-[15px] font-extrabold uppercase tracking-wider text-[#1F1F1F] mb-2.5">
                Articles Tags
              </h3>
              <div className="relative w-full h-[1.5px] bg-[#EEEEEE] mb-4" aria-hidden="true">
                <div className="absolute left-0 top-0 w-12 h-[2px] bg-[#15472B]" />
              </div>

              <div className="flex flex-wrap gap-2">
                {dynamicTags.map((tag) => {
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isActive ? 'All' : tag)}
                      className={`text-[11.5px] px-3 py-1.5 border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#15472B] text-white border-[#15472B] font-semibold'
                          : 'bg-white text-[#555555] border-[#E0E0E0] hover:border-[#15472B] hover:text-[#15472B] hover:bg-[#FBFBFA]'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
};
