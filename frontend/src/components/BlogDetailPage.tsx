import React, { useState, useEffect } from 'react';
import { Share2, Check, Loader2 } from 'lucide-react';
import { BlogPost, Product, BlogComment } from '../data/storeData';
import { fetchBlogs, fetchProducts, fetchBlogById, submitBlogComment } from '../services/api';

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

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

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

  const [comments, setComments] = useState<BlogComment[]>(initialPost.comments || []);
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentCity, setCommentCity] = useState('Lahore');
  const [commentBody, setCommentBody] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState<string | null>(null);

  // Sync state if initialPost updates from parent
  useEffect(() => {
    setPost(initialPost);
    setComments(initialPost.comments || []);
  }, [initialPost]);

  // Fetch full post and related content if missing or to ensure real-time fresh data
  useEffect(() => {
    let isMounted = true;
    if (initialPost.id || initialPost.slug) {
      const targetId = initialPost.slug || initialPost.id;
      fetchBlogById(targetId, { forceFresh: true })
        .then((fullPost) => {
          if (isMounted && fullPost) {
            setPost(fullPost);
            setComments(fullPost.comments || []);
          }
        })
        .catch((err) => console.error('Failed to load full post:', err));
    }

    if (initialRelated.length === 0) {
      fetchBlogs()
        .then((all) => {
          if (isMounted) {
            setRelatedPosts(all.filter((p) => p.id !== initialPost.id && p.slug !== initialPost.slug).slice(0, 3));
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
  }, [initialPost.id, initialPost.slug, initialRelated.length, initialFeatured.length]);

  const handleShare = () => {
    const text = `${post.title} — Pak Veda Harvest Journal`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href || text).catch(() => {});
    }
    setCopiedNotice('Article link copied to clipboard.');
    window.setTimeout(() => setCopiedNotice(null), 2500);
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentAuthor.trim() || !commentBody.trim() || submittingComment) return;
    setSubmittingComment(true);
    setCommentSuccess(null);

    try {
      const targetSlug = post.slug || post.id;
      const res = await submitBlogComment(targetSlug, {
        author: commentAuthor.trim(),
        city: commentCity,
        comment: commentBody.trim(),
      });

      if (res.comments && res.comments.length > 0) {
        setComments(res.comments);
      } else {
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
      }

      setCommentAuthor('');
      setCommentBody('');
      setCommentSuccess('Thank you! Your note has been published.');
      window.setTimeout(() => setCommentSuccess(null), 4000);
    } catch (err) {
      console.error('Failed to submit comment:', err);
      // Fallback local update
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
      setCommentSuccess('Your note has been posted.');
      window.setTimeout(() => setCommentSuccess(null), 4000);
    } finally {
      setSubmittingComment(false);
    }
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
                <span className="text-[#C46B3B] font-semibold">
                  {post.category || 'Harvest & Extraction'}
                </span>
                <span className="text-[#CCCCCC]" aria-hidden="true">
                  |
                </span>
                <span className="text-[#666666] tabular-nums">
                  By <strong className="font-medium text-[#333333]">{post.author || 'Pak Veda'}</strong> · {post.day} {post.month} {post.year || '2026'} · {post.readTime}
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
                  alt={post.alt || post.title}
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
            </div>

            {/* Dynamic Key Takeaways / Notes Strip (Rendered only when defined) */}
            {post.takeaways && post.takeaways.length > 0 && (
              <div className="mt-8 bg-[#FAF3F0] p-6 sm:p-7">
                <p className="text-[11.5px] uppercase tracking-[0.09em] text-[#C46B3B] font-semibold mb-3">
                  Key Highlights &amp; Practical Notes
                </p>
                <ul className="space-y-2 text-[13.5px] text-[#444444]">
                  {post.takeaways.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-[4px] h-[4px] bg-[#C46B3B] shrink-0 mt-2" aria-hidden="true" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Merchandising Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-8 pt-5 border-t border-[#EAEAEA] flex flex-wrap items-center gap-2">
                <span className="text-[11.5px] uppercase tracking-wider text-[#888888] font-semibold mr-1">
                  Tags:
                </span>
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] px-2.5 py-1 bg-[#F9F9F8] border border-[#E5E5E5] text-[#555555]"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

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

              {comments.length === 0 ? (
                <p className="text-[13.5px] text-[#888888] italic py-3 mb-6">
                  No reader notes yet. Be the first to share your experience or kitchen tip!
                </p>
              ) : (
                <div className="space-y-4 mb-8">
                  {comments.map((item, idx) => (
                    <div key={item.id || idx} className="border border-[#EAEAEA] bg-white p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <p className="text-[14px] font-medium text-[#181818]">
                          {item.author} · <span className="text-[#666666] font-normal">{item.city}</span>
                        </p>
                        <span className="text-[12px] text-[#777777]">{item.date || 'Recently'}</span>
                      </div>
                      <p className="text-[13.5px] leading-[1.68] text-[#555555]">{item.comment}</p>
                    </div>
                  ))}
                </div>
              )}

              {commentSuccess && (
                <div className="mb-4 bg-[#EDF7ED] border border-[#C8E6C9] text-[#2E7D32] px-4 py-3 text-[13px] flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{commentSuccess}</span>
                </div>
              )}

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
                    <option>Faisalabad</option>
                    <option>Quetta</option>
                    <option>Sialkot</option>
                    <option>Gujranwala</option>
                    <option>Abbottabad</option>
                    <option>Skardu</option>
                    <option>Gilgit</option>
                    <option>Swat</option>
                    <option>Chakwal</option>
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
                  disabled={submittingComment}
                  className="bg-[#0B0B0B] hover:bg-[#15472B] disabled:opacity-60 text-white text-[11.5px] font-semibold uppercase tracking-[0.08em] px-6 py-3 transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  {submittingComment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{submittingComment ? 'SUBMITTING...' : 'POST COMMENT'}</span>
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
