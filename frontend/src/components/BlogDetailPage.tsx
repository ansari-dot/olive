import React, { useState, useEffect } from 'react';
import { Share2 } from 'lucide-react';
import { BlogPost, Product } from '../data/storeData';
import { fetchBlogs, fetchProducts, fetchBlogById } from '../services/api';

interface BlogDetailPageProps {
  post: BlogPost;
  relatedPosts?: BlogPost[];
  featuredProducts?: Product[];
  onSelectPost: (post: BlogPost) => void;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
  onNavigateHome: () => void;
  onNavigateBlogs: () => void;
  onNavigateShop: () => void;
}

interface BlogComment {
  id: string;
  author: string;
  city: string;
  date: string;
  comment: string;
}

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

const inferTopic = (post: BlogPost): string => {
  const lower = post.title.toLowerCase();
  if (lower.includes('health')) return 'Olive Health';
  if (lower.includes('superfood')) return 'Culinary';
  return 'Purity';
};

export const BlogDetailPage: React.FC<BlogDetailPageProps> = ({
  post: initialPost,
  relatedPosts: initialRelated = [],
  featuredProducts: initialFeatured = [],
  onSelectPost,
  onSelectProduct,
  onAddToCart,
  onNavigateHome,
  onNavigateBlogs,
  onNavigateShop,
}) => {
  const [post, setPost] = useState<BlogPost>(initialPost);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>(initialRelated);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>(initialFeatured);
  const [imgBroken, setImgBroken] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState<string | null>(null);

  const [comments, setComments] = useState<BlogComment[]>([
    {
      id: 'bc-1',
      author: 'Sana Mahmood',
      city: 'Karachi',
      date: '12 Oct 2026',
      comment:
        'Thank you for sharing the acidity testing process—knowing the exact harvest standard makes choosing daily cold-pressed olive oil effortless.',
    },
  ]);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentCity, setCommentCity] = useState('Lahore');
  const [commentBody, setCommentBody] = useState('');

  // Fetch full post and related content if missing
  useEffect(() => {
    let isMounted = true;
    if (initialPost.id) {
      fetchBlogById(initialPost.id)
        .then((fullPost) => {
          if (isMounted && fullPost) setPost(fullPost);
        })
        .catch((err) => console.error('Failed to load full post:', err));
    }

    if (initialRelated.length === 0) {
      fetchBlogs()
        .then((all) => {
          if (isMounted) {
            setRelatedPosts(all.filter((p) => p.id !== initialPost.id).slice(0, 3));
          }
        })
        .catch((err) => console.error('Failed to load related blogs:', err));
    }

    if (initialFeatured.length === 0) {
      fetchProducts({ section: 'featured-grid', limit: 4 })
        .then((res) => {
          if (isMounted) setFeaturedProducts(res.products);
        })
        .catch((err) => console.error('Failed to load featured products:', err));
    }

    return () => {
      isMounted = false;
    };
  }, [initialPost.id, initialRelated.length, initialFeatured.length]);

  const handleShare = () => {
    const text = `${post.title} — Zaitoon Pakistan Orchard Journal`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
    setCopiedNotice('Article link copied to clipboard.');
    window.setTimeout(() => setCopiedNotice(null), 2500);
  };

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentBody.trim()) return;
    setComments((prev) => [
      {
        id: `bc-${Date.now()}`,
        author: commentAuthor.trim(),
        city: commentCity,
        date: 'Today',
        comment: commentBody.trim(),
      },
      ...prev,
    ]);
    setCommentAuthor('');
    setCommentBody('');
  };

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb: Home / Blogs / Article Title */}
        <nav
          aria-label="Breadcrumb"
          className="mb-8 text-[12.5px] text-[#777777] flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span aria-hidden="true">/</span>
          <button
            type="button"
            onClick={onNavigateBlogs}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Blogs
          </button>
          <span aria-hidden="true">/</span>
          <span className="text-[#444444]">{post.title}</span>
        </nav>

        {/* Main 2-Column Editorial Layout: Article Body + Related Harvest Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* Left Article Body */}
          <article className="lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3 text-[11.5px] uppercase tracking-[0.09em]">
                <span className="text-[#C46B3B] font-semibold">{inferTopic(post)}</span>
                <span className="text-[#CCCCCC]" aria-hidden="true">
                  |
                </span>
                <span className="text-[#666666] tabular-nums">
                  {post.day} {post.month} · {post.readTime}
                </span>
              </div>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex items-center gap-1.5 text-[11.5px] uppercase tracking-[0.08em] text-[#555555] hover:text-[#181818] cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {copiedNotice && (
              <p className="mb-4 text-[12.5px] text-[#15472B] bg-[#FAF3F0] px-4 py-2">
                {copiedNotice}
              </p>
            )}

            <h1 className="text-[30px] sm:text-[38px] font-normal text-[#181818] leading-tight">
              {post.title}
            </h1>

            {/* Featured Studio Hero Image with Top-Left Black Date Tile */}
            <div className="relative mt-6 aspect-[16/9] w-full bg-[#FAF3F0] overflow-hidden">
              <div className="absolute top-0 left-0 z-10 w-[56px] h-[56px] bg-[#0B0B0B] text-white flex flex-col items-center justify-center leading-tight tabular-nums">
                <span className="text-[16px] font-normal">{post.day}</span>
                <span className="text-[12.5px] font-normal text-white/90">{post.month}</span>
              </div>

              {!imgBroken ? (
                <img
                  src={post.image}
                  alt={post.alt}
                  referrerPolicy="no-referrer"
                  onError={() => setImgBroken(true)}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-8 text-[#15472B]">
                  <span className="font-serif-brand text-xl">{post.title}</span>
                </div>
              )}
            </div>

            {/* Lead Summary */}
            <p className="mt-7 text-[16px] sm:text-[17px] leading-[1.72] text-[#262626] border-l-2 border-[#C46B3B] pl-5">
              {post.excerpt}
            </p>

            {/* Full Editorial Paragraphs */}
            <div className="mt-6 space-y-5 text-[14.5px] sm:text-[15px] leading-[1.8] text-[#555555]">
              {post.content.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
              <p>
                Across Zaitoon Pakistan’s partner groves in Potohar, Chakwal, and Swat Valley,
                preserving olive polyphenols begins at the orchard gate. Olives are picked into
                ventilated crates—never stacked in heat-trapping sacks—and milled the same afternoon
                to protect fresh leafy aroma and low free fatty acidity (&lt; 0.3%).
              </p>
            </div>

            {/* Key Orchard Takeaways Strip */}
            <div className="mt-8 bg-[#FAF3F0] p-6 sm:p-7">
              <p className="text-[11.5px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold mb-3">
                Orchard Storage &amp; Daily Use Note
              </p>
              <ul className="space-y-2 text-[13.5px] text-[#444444]">
                <li className="flex items-start gap-2.5">
                  <span className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0 mt-2" aria-hidden="true" />
                  <span>Keep bottles tightly corked in a cool pantry away from stove heat.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0 mt-2" aria-hidden="true" />
                  <span>Use dark-glass bottles within 4–6 months of opening for peak freshness.</span>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0 mt-2" aria-hidden="true" />
                  <span>Ideal for finishing grilled meats, lentils, salads, and warm flatbreads.</span>
                </li>
              </ul>
            </div>

            {/* Back to Blogs Toolbar */}
            <div className="mt-8 pt-6 border-t border-[#EAEAEA] flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={onNavigateBlogs}
                className="border border-[#181818] bg-white hover:bg-[#181818] hover:text-white px-5 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] transition-colors cursor-pointer"
              >
                &larr; BACK TO ALL BLOGS
              </button>
              <button
                type="button"
                onClick={onNavigateShop}
                className="bg-[#0B0B0B] hover:bg-[#15472B] text-white px-6 py-2.5 text-[11.5px] font-semibold uppercase tracking-[0.08em] transition-colors cursor-pointer"
              >
                SHOP HARVESTS
              </button>
            </div>

            {/* Reader Comments Section */}
            <section aria-labelledby="blog-comments-heading" className="mt-12 pt-10 border-t border-[#EAEAEA]">
              <h2
                id="blog-comments-heading"
                className="text-[22px] font-normal text-[#181818] mb-6"
              >
                Reader Notes ({comments.length})
              </h2>

              <div className="space-y-4 mb-8">
                {comments.map((item) => (
                  <div key={item.id} className="border border-[#EAEAEA] bg-white p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-[14px] font-medium text-[#181818]">
                        {item.author} · <span className="text-[#666666] font-normal">{item.city}</span>
                      </p>
                      <span className="text-[12px] text-[#777777]">{item.date}</span>
                    </div>
                    <p className="text-[13.5px] leading-[1.68] text-[#555555]">{item.comment}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSubmitComment} className="bg-[#FAF3F0] p-6 sm:p-7 space-y-4">
                <h3 className="text-[16px] font-normal text-[#181818]">Leave a Note</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={commentAuthor}
                    onChange={(e) => setCommentAuthor(e.target.value)}
                    placeholder="Your Name"
                    className="border border-[#D4D4D4] bg-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-[#181818]"
                  />
                  <select
                    value={commentCity}
                    onChange={(e) => setCommentCity(e.target.value)}
                    className="border border-[#D4D4D4] bg-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-[#181818]"
                  >
                    <option>Lahore</option>
                    <option>Islamabad</option>
                    <option>Karachi</option>
                    <option>Rawalpindi</option>
                    <option>Peshawar</option>
                    <option>Multan</option>
                  </select>
                </div>
                <textarea
                  rows={3}
                  required
                  value={commentBody}
                  onChange={(e) => setCommentBody(e.target.value)}
                  placeholder="Share your experience or kitchen tip..."
                  className="w-full border border-[#D4D4D4] bg-white px-3.5 py-2.5 text-[13.5px] focus:outline-none focus:border-[#181818]"
                />
                <button
                  type="submit"
                  className="bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[11.5px] font-semibold uppercase tracking-[0.08em] px-6 py-3 transition-colors cursor-pointer"
                >
                  POST COMMENT
                </button>
              </form>
            </section>
          </article>

          {/* Right Column: Featured Olive Oils & Related Reads */}
          <aside aria-label="Featured harvests and related stories" className="lg:col-span-4 space-y-9">
            {/* Related Stories */}
            {relatedPosts.length > 0 && (
              <div className="border border-[#EAEAEA] p-6">
                <h2 className="text-[18px] font-normal text-[#181818] pb-3 mb-5 border-b border-[#EAEAEA]">
                  More From Our Journal
                </h2>
                <div className="space-y-5">
                  {relatedPosts.map((other) => (
                    <div key={other.id} className="flex items-start gap-3.5 group">
                      <button
                        type="button"
                        onClick={() => onSelectPost(other)}
                        className="w-[74px] h-[62px] bg-[#FAF3F0] overflow-hidden shrink-0 cursor-pointer"
                      >
                        <img
                          src={other.image}
                          alt={other.alt}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-200"
                        />
                      </button>
                      <div className="min-w-0">
                        <p className="text-[11px] text-[#777777] tabular-nums">
                          {other.day} {other.month} · {other.readTime}
                        </p>
                        <button
                          type="button"
                          onClick={() => onSelectPost(other)}
                          className="mt-0.5 text-left text-[14px] font-normal text-[#181818] hover:text-[#C46B3B] transition-colors leading-snug cursor-pointer"
                        >
                          {other.title}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Featured Harvest Bottles */}
            {featuredProducts.length > 0 && (
              <div className="bg-[#FAF3F0] p-6">
                <h2 className="text-[18px] font-normal text-[#181818] pb-3 mb-5 border-b border-[#E6DDD2]">
                  From Our Groves
                </h2>
                <div className="space-y-5">
                  {featuredProducts.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => onSelectProduct(item)}
                          className="w-[54px] h-[64px] bg-white overflow-hidden shrink-0 cursor-pointer"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        </button>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => onSelectProduct(item)}
                            className="text-left text-[13.5px] font-normal text-[#181818] hover:text-[#15472B] truncate block w-full cursor-pointer"
                          >
                            {item.name}
                          </button>
                          <p className="text-[12.5px] text-[#555555] tabular-nums mt-0.5">
                            {formatPKR(item.price)}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onAddToCart(item)}
                        className="px-3 py-1.5 bg-[#0B0B0B] hover:bg-[#15472B] text-white text-[10.5px] uppercase tracking-[0.08em] shrink-0 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
};
