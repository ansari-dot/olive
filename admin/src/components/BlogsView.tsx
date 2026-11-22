import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  RefreshCw,
  BookOpen,
  MessageSquare,
  User,
  Search,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Sparkles,
  Eye,
  Clock,
  Tag,
  Check,
} from 'lucide-react';
import {
  DEFAULT_IMAGE_PLACEHOLDER,
  createAdminBlog,
  deleteAdminBlog,
  deleteAdminBlogComment,
  fetchAdminBlogs,
  resolveAssetUrl,
  updateAdminBlog,
  uploadAdminImage,
} from '../services/adminApi';
import type { AdminBlogPost, AdminBlogComment } from '../types/admin';

interface BlogFormState {
  title: string;
  slug: string;
  day: string;
  month: string;
  year: string;
  author: string;
  category: string;
  tagsText: string;
  readTime: string;
  excerpt: string;
  image: string;
  alt: string;
  contentText: string;
  takeawaysText: string;
  isPopular: boolean;
  isPublished: boolean;
}

const EMPTY_BLOG_FORM: BlogFormState = {
  title: '',
  slug: '',
  day: String(new Date().getDate()).padStart(2, '0'),
  month: new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  year: String(new Date().getFullYear()),
  author: 'Pak Veda',
  category: 'Harvest & Extraction',
  tagsText: 'Extra Virgin, Cold-Pressed, Potohar',
  readTime: '4 min read',
  excerpt: '',
  image: '',
  alt: '',
  contentText: '',
  takeawaysText: '',
  isPopular: false,
  isPublished: true,
};

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

const BLOG_CATEGORIES = [
  'Harvest & Extraction',
  'Health & Vitality',
  'Culinary Traditions',
  'Terroir & Heritage',
  'Organic Farming',
];

export const BlogsView: React.FC = () => {
  const [blogs, setBlogs] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Two-step delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Reader Notes (Comments) Modal state
  const [commentsModalOpen, setCommentsModalOpen] = useState(false);
  const [selectedBlogForComments, setSelectedBlogForComments] = useState<AdminBlogPost | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState<string | null>(null);

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminBlogs();
      setBlogs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load journal articles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBlogs();
  }, []);

  // Top 4 KPI Metrics
  const kpiData = useMemo(() => {
    const totalCount = blogs.length;
    let publishedCount = 0;
    let popularCount = 0;
    let totalComments = 0;

    blogs.forEach((b) => {
      if (b.isPublished) publishedCount += 1;
      if (b.isPopular) popularCount += 1;
      totalComments += (b.comments || []).length;
    });

    return {
      totalCount,
      publishedCount,
      popularCount,
      totalComments,
    };
  }, [blogs]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_BLOG_FORM);
    setModalOpen(true);
  };

  const openEdit = (post: AdminBlogPost) => {
    setEditingId(post._id);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      day: post.day || String(new Date().getDate()).padStart(2, '0'),
      month: post.month || new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase(),
      year: post.year || String(new Date().getFullYear()),
      author: post.author || 'Pak Veda',
      category: post.category || 'Harvest & Extraction',
      tagsText: (post.tags || []).join(', '),
      readTime: post.readTime || '4 min read',
      excerpt: post.excerpt || '',
      image: post.image || '',
      alt: post.alt || '',
      contentText: Array.isArray(post.content) ? post.content.join('\n\n') : '',
      takeawaysText: Array.isArray(post.takeaways) ? post.takeaways.join('\n') : '',
      isPopular: Boolean(post.isPopular),
      isPublished: post.isPublished ?? true,
    });
    setModalOpen(true);
  };

  const openCommentsModal = (post: AdminBlogPost) => {
    setSelectedBlogForComments(post);
    setConfirmDeleteCommentId(null);
    setCommentsModalOpen(true);
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedBlogForComments) return;
    setDeletingCommentId(commentId);
    try {
      await deleteAdminBlogComment(selectedBlogForComments._id, commentId);
      const updatedComments = (selectedBlogForComments.comments || []).filter(
        (c) => c._id !== commentId
      );
      setSelectedBlogForComments({
        ...selectedBlogForComments,
        comments: updatedComments,
      });
      setBlogs((prev) =>
        prev.map((b) =>
          b._id === selectedBlogForComments._id ? { ...b, comments: updatedComments } : b
        )
      );
      setConfirmDeleteCommentId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete reader comment.');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const content = form.contentText
        .split('\n\n')
        .map((p) => p.trim())
        .filter(Boolean);

      const takeaways = form.takeawaysText
        .split('\n')
        .map((t) => t.trim())
        .filter(Boolean);

      const tags = form.tagsText
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const payload = {
        title: form.title.trim(),
        slug: form.slug.trim() || toSlug(form.title),
        day: form.day.trim(),
        month: form.month.trim().toUpperCase(),
        year: form.year.trim(),
        author: form.author.trim(),
        category: form.category.trim(),
        tags,
        readTime: form.readTime.trim(),
        excerpt: form.excerpt.trim(),
        image: form.image.trim(),
        alt: form.alt.trim() || form.title.trim(),
        content,
        takeaways,
        isPopular: form.isPopular,
        isPublished: form.isPublished,
      };

      if (editingId) {
        await updateAdminBlog(editingId, payload);
      } else {
        await createAdminBlog(payload);
      }

      setModalOpen(false);
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteAdminBlog(id);
      setConfirmDeleteId(null);
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete article.');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered blogs
  const filteredBlogs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogs.filter((b) => {
      const matchesSearch =
        !q ||
        (b.title || '').toLowerCase().includes(q) ||
        (b.author || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q) ||
        (b.excerpt || '').toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'All' || b.category === categoryFilter;

      return matchesSearch && matchesCat;
    });
  }, [blogs, search, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* Page Title & Search Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-[25px] font-bold text-[#0F172A] tracking-tight flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 text-[#15472B]" />
            Orchard Journal &amp; Editorial Console
          </h2>
          <p className="text-[13px] text-[#64748B] mt-0.5">
            Publish harvest essays, cold-press guides, botanical wellness articles, and moderate reader comments.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, author..."
              className="w-[200px] sm:w-[250px] border border-[#CBD5E1] bg-white rounded-xl pl-3.5 pr-9 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B] transition-all shadow-2xs"
            />
            <Search className="w-4 h-4 text-[#94A3B8] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <button
            type="button"
            onClick={() => void loadBlogs()}
            aria-label="Refresh articles"
            title="Refresh Articles"
            className="border border-[#E5E9E4] bg-white hover:border-[#0F172A] p-2 rounded-xl text-[#334155] cursor-pointer shadow-2xs transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#15472B]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={openCreate}
            className="bg-[#0E291C] hover:bg-[#15472B] text-white px-4 py-2 rounded-xl text-[12.5px] font-semibold tracking-wide cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] rounded-2xl px-4 py-3 text-[13px] text-[#B91C1C] flex items-center gap-2 shadow-2xs">
          <AlertTriangle className="w-4 h-4 shrink-0 text-[#DC2626]" />
          <span>{error}</span>
        </div>
      )}

      {/* Row 1: Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Articles */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Total Articles</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Editorial catalog</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.totalCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">●</span>
              <span>Across all journal categories</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,58 C30,52 50,30 80,45 C110,60 125,25 140,32 L140,65 L0,65 Z"
                fill="url(#waveBlog1)"
              />
              <defs>
                <linearGradient id="waveBlog1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#86EFAC" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Published Live */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Published Live</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Visible on Storefront</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.publishedCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">✓</span>
              <span>Available for customer reading</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M30,62 C60,48 85,22 115,38 C128,45 136,25 140,20 L140,65 L30,65 Z"
                fill="url(#waveBlog2)"
              />
              <defs>
                <linearGradient id="waveBlog2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#BBF7D0" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.08" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 3: Reader Community Comments */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Reader Notes</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Community engagement</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.totalComments}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">↑</span>
              <span>Comments submitted by readers</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M10,65 C40,40 70,60 100,30 C120,45 130,20 140,25 L140,65 Z"
                fill="url(#waveBlog3)"
              />
              <defs>
                <linearGradient id="waveBlog3" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#93C5FD" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 4: Popular Harvest Picks */}
        <div className="bg-white rounded-2xl border border-[#E5E9E4] p-4.5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] relative overflow-hidden flex flex-col justify-between min-h-[144px]">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-[#0F3520] flex items-center justify-center shrink-0 shadow-inner text-[#4ADE80]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0F172A] leading-tight">Popular Picks</p>
              <p className="text-[11px] text-[#64748B] mt-0.5">Featured highlight posts</p>
            </div>
          </div>

          <div className="mt-3 relative z-10">
            <p className="text-[25px] font-bold text-[#0F172A] font-mono-data tracking-tight leading-none">
              {kpiData.popularCount}
            </p>
            <p className="mt-2 text-[12px] text-[#475569] font-mono-data flex items-center gap-1.5">
              <span className="text-[#16A34A] font-bold">★</span>
              <span>Featured on journal homepage</span>
            </p>
          </div>

          <div className="absolute right-0 bottom-0 pointer-events-none z-0">
            <svg width="140" height="65" viewBox="0 0 140 65" fill="none">
              <path
                d="M0,60 C40,55 60,35 90,45 C120,55 130,28 140,35 L140,65 Z"
                fill="url(#waveBlog4)"
              />
              <defs>
                <linearGradient id="waveBlog4" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2E8F0] pb-2 text-[13px]">
        {['All', ...BLOG_CATEGORIES].map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1.5 rounded-lg font-semibold cursor-pointer transition-colors ${
              categoryFilter === cat
                ? 'bg-[#15472B] text-white shadow-2xs'
                : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]'
            }`}
          >
            {cat}
          </button>
        ))}
        <span className="text-[#94A3B8] ml-auto text-[12px] font-mono-data">
          Showing {filteredBlogs.length} of {blogs.length}
        </span>
      </div>

      {/* Luxury Articles Table */}
      <div className="bg-white rounded-2xl border border-[#E5E9E4] overflow-x-auto shadow-2xs">
        {loading && blogs.length === 0 ? (
          <div className="p-12 text-center text-[13.5px] text-[#64748B]">
            Loading journal articles...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-14 text-center space-y-3">
            <BookOpen className="w-10 h-10 text-[#CBD5E1] mx-auto" />
            <p className="text-[14.5px] font-semibold text-[#0F172A]">
              No articles match your query
            </p>
            <p className="text-[12.5px] text-[#64748B] max-w-sm mx-auto">
              Write harvest essays, cold-press stories, or extraction techniques for your customers to read.
            </p>
            <button
              type="button"
              onClick={openCreate}
              className="bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 rounded-xl text-[12px] font-semibold cursor-pointer shadow-2xs"
            >
              Write First Article
            </button>
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3.5 px-5 text-left font-semibold">Article &amp; Author</th>
                <th className="py-3.5 px-5 text-left font-semibold">Category</th>
                <th className="py-3.5 px-5 text-left font-semibold">Publication Date</th>
                <th className="py-3.5 px-5 text-center font-semibold">Engagement</th>
                <th className="py-3.5 px-5 text-left font-semibold">Status</th>
                <th className="py-3.5 px-5 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredBlogs.map((b) => {
                const isConfirming = confirmDeleteId === b._id;
                const isDeleting = deletingId === b._id;
                const commentCount = (b.comments || []).length;

                return (
                  <tr key={b._id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Title, Thumbnail & Author */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={resolveAssetUrl(b.image)}
                          alt={b.title}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-[#E2E8F0] bg-white shrink-0 shadow-2xs"
                        />
                        <div className="min-w-0">
                          <h4 className="font-semibold text-[#0F172A] text-[13.5px] line-clamp-1">
                            {b.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11.5px] text-[#64748B] mt-0.5">
                            <span>By {b.author || 'Pak Veda'}</span>
                            <span>·</span>
                            <span className="font-mono-data text-[#15472B]">/{b.slug}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-5">
                      <span className="inline-block text-[11px] font-semibold text-[#15472B] bg-[#F4F9F5] border border-[#D5E6D8] px-2.5 py-0.5 rounded-full">
                        {b.category || 'Harvest'}
                      </span>
                    </td>

                    {/* Date & Read Time */}
                    <td className="py-3.5 px-5 font-mono-data text-[12px] text-[#475569]">
                      <div>{b.day} {b.month} {b.year}</div>
                      <span className="text-[11px] text-[#94A3B8]">{b.readTime || '4 min read'}</span>
                    </td>

                    {/* Engagement / Comments & Popular Badge */}
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {b.isPopular && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#D97706] bg-[#FEF3C7] px-2 py-0.5 rounded-full border border-[#FDE68A]">
                            <Sparkles className="w-2.5 h-2.5 fill-[#D97706]" />
                            <span>Popular</span>
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openCommentsModal(b)}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#F1F5F9] text-[#475569] hover:bg-[#E2E8F0] border border-[#CBD5E1] cursor-pointer transition-colors"
                          title="View reader comments"
                        >
                          <MessageSquare className="w-3 h-3 text-[#15472B]" />
                          <span>{commentCount}</span>
                        </button>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          b.isPublished
                            ? 'bg-[#DCFCE7] text-[#16A34A] border-[#86EFAC]'
                            : 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            b.isPublished ? 'bg-[#16A34A]' : 'bg-[#D97706]'
                          }`}
                        />
                        <span>{b.isPublished ? 'Published' : 'Draft'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(b)}
                          aria-label={`Edit ${b.title}`}
                          className="p-1.5 border border-[#CBD5E1] hover:border-[#0F172A] rounded-lg text-[#334155] cursor-pointer transition-colors shadow-2xs"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>

                        {isConfirming ? (
                          <div className="inline-flex items-center gap-1.5 animate-in fade-in duration-150">
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => void handleDelete(b._id)}
                              className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white px-2.5 py-1 text-[11px] font-semibold rounded-lg cursor-pointer shadow-2xs"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="border border-[#CBD5E1] px-2 py-1 text-[11px] text-[#475569] rounded-lg cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(b._id)}
                            aria-label={`Delete ${b.title}`}
                            className="p-1.5 border border-[#FECACA] hover:bg-[#FEF2F2] rounded-lg text-[#DC2626] cursor-pointer transition-colors shadow-2xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Write / Edit Article Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-[800px] max-h-[92vh] bg-white rounded-2xl border border-[#E5E9E4] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <h3 className="text-[17px] font-bold text-white font-mono-data">
                  {editingId ? 'Edit Journal Article' : 'Compose New Journal Article'}
                </h3>
                <p className="text-[12px] text-white/70 mt-0.5">
                  Craft essays on olive cultivars, extraction methods, wellness recipes, and farm stories.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-[13px]">
              {/* Section 1: Title, Slug & Category */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Article Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Why Low-Acidity Early Harvest Olive Oil Matters"
                    value={form.title}
                    onChange={(e) => {
                      const newTitle = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: newTitle,
                        slug: prev.slug === toSlug(prev.title) || !prev.slug ? toSlug(newTitle) : prev.slug,
                      }));
                    }}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      URL Slug
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. why-low-acidity-early-harvest-matters"
                      value={form.slug}
                      onChange={(e) => setForm((prev) => ({ ...prev, slug: toSlug(e.target.value) }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] font-mono focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Category
                    </label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((prev) => ({ ...prev, category: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] bg-white focus:outline-none focus:border-[#15472B]"
                    >
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Author, Read Time & Date */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Author
                    </label>
                    <input
                      type="text"
                      value={form.author}
                      onChange={(e) => setForm((prev) => ({ ...prev, author: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Read Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 5 min read"
                      value={form.readTime}
                      onChange={(e) => setForm((prev) => ({ ...prev, readTime: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Day &amp; Month
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="DD"
                        value={form.day}
                        onChange={(e) => setForm((prev) => ({ ...prev, day: e.target.value }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-2 py-2 text-center text-[13px] focus:outline-none focus:border-[#15472B]"
                      />
                      <input
                        type="text"
                        placeholder="MMM"
                        value={form.month}
                        onChange={(e) => setForm((prev) => ({ ...prev, month: e.target.value.toUpperCase() }))}
                        className="w-1/2 border border-[#CBD5E1] rounded-xl px-2 py-2 text-center text-[13px] uppercase focus:outline-none focus:border-[#15472B]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[12px] font-semibold text-[#334155]">
                      Year
                    </label>
                    <input
                      type="text"
                      placeholder="YYYY"
                      value={form.year}
                      onChange={(e) => setForm((prev) => ({ ...prev, year: e.target.value }))}
                      className="w-full border border-[#CBD5E1] rounded-xl px-3 py-2 text-[13px] text-center focus:outline-none focus:border-[#15472B]"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Cover Image */}
              <div className="bg-[#FAF8F5] border border-[#E8E4DB] rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Cover Photograph <span className="text-red-500">*</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 bg-white border border-[#CBD5E1] hover:bg-[#F1F5F9] px-3 py-1.5 rounded-xl text-[12px] font-semibold text-[#15472B] cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{uploading ? 'Uploading...' : 'Upload Image File'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleUploadFile}
                      disabled={uploading}
                    />
                  </label>
                </div>

                <div className="flex gap-3 items-center">
                  <input
                    type="text"
                    required
                    placeholder="Paste image path or URL..."
                    value={form.image}
                    onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
                    className="flex-1 border border-[#CBD5E1] bg-white rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                  <div className="w-14 h-12 rounded-lg border border-[#CBD5E1] bg-white overflow-hidden shrink-0 flex items-center justify-center">
                    <img
                      src={resolveAssetUrl(form.image)}
                      alt="Cover preview"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = DEFAULT_IMAGE_PLACEHOLDER;
                      }}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Excerpt & Tags */}
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Short Excerpt / Lead Summary <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="1–2 sentence teaser summary displayed in blog listings..."
                    value={form.excerpt}
                    onChange={(e) => setForm((prev) => ({ ...prev, excerpt: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Tags (Comma-separated)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Extra Virgin, Cold-Pressed, Polyphenols, Potohar"
                    value={form.tagsText}
                    onChange={(e) => setForm((prev) => ({ ...prev, tagsText: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Key Takeaways (One per line)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Highlight 1&#10;Highlight 2&#10;Highlight 3"
                    value={form.takeawaysText}
                    onChange={(e) => setForm((prev) => ({ ...prev, takeawaysText: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] font-mono text-[12.5px] focus:outline-none focus:border-[#15472B]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[12px] font-semibold text-[#334155]">
                    Full Article Content (Separate paragraphs with blank lines) <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={8}
                    required
                    placeholder="Write the full body story here. Use double newlines between paragraphs..."
                    value={form.contentText}
                    onChange={(e) => setForm((prev) => ({ ...prev, contentText: e.target.value }))}
                    className="w-full border border-[#CBD5E1] rounded-xl px-3.5 py-2 text-[13px] leading-relaxed focus:outline-none focus:border-[#15472B] focus:ring-1 focus:ring-[#15472B]"
                  />
                </div>
              </div>

              {/* Flags */}
              <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPublished: e.target.checked }))}
                    className="accent-[#15472B] w-4 h-4 rounded"
                  />
                  <span>Published Live on Storefront</span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-medium text-[#0F172A]">
                  <input
                    type="checkbox"
                    checked={form.isPopular}
                    onChange={(e) => setForm((prev) => ({ ...prev, isPopular: e.target.checked }))}
                    className="accent-[#15472B] w-4 h-4 rounded"
                  />
                  <span>Mark as Popular / Featured Pick</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 sticky bottom-0 bg-white py-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#CBD5E1] hover:bg-[#F1F5F9] px-4 py-2 text-[12.5px] font-medium text-[#334155] rounded-xl cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-[#15472B] hover:bg-[#0F3620] disabled:bg-[#94A3B8] text-white px-6 py-2 text-[12.5px] font-semibold rounded-xl cursor-pointer shadow-2xs transition-colors"
                >
                  {saving ? 'Saving...' : editingId ? 'Save Changes' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reader Notes (Comments) Management Modal */}
      {commentsModalOpen && selectedBlogForComments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-[650px] max-h-[85vh] bg-white rounded-2xl border border-[#E5E9E4] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-[#0E291C] text-white flex items-center justify-between border-b border-[#1C4D32]">
              <div>
                <h3 className="text-[17px] font-bold text-white font-mono-data">
                  Reader Comments &amp; Notes
                </h3>
                <p className="text-[12px] text-white/70 mt-0.5 line-clamp-1">
                  {selectedBlogForComments.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setCommentsModalOpen(false)}
                aria-label="Close modal"
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(selectedBlogForComments.comments || []).length === 0 ? (
                <div className="py-12 text-center text-[#64748B] space-y-2">
                  <MessageSquare className="w-8 h-8 text-[#CBD5E1] mx-auto" />
                  <p className="text-[14px] font-semibold text-[#334155]">
                    No reader notes yet
                  </p>
                  <p className="text-[12.5px] text-[#94A3B8]">
                    When readers comment on this article, their thoughts will appear here.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(selectedBlogForComments.comments || []).map((comment) => {
                    const isConfirming = confirmDeleteCommentId === comment._id;
                    const isDeleting = deletingCommentId === comment._id;
                    return (
                      <div
                        key={comment._id}
                        className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-start justify-between gap-3"
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-[13px] text-[#0F172A]">
                              {comment.author}
                            </span>
                            {comment.email && (
                              <span className="text-[11.5px] text-[#2563EB] font-mono-data">
                                ({comment.email})
                              </span>
                            )}
                          </div>
                          <p className="text-[12.5px] text-[#334155] leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-[#E2E8F0]">
                            {comment.content}
                          </p>
                        </div>

                        <div className="shrink-0 pt-1">
                          {isConfirming ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => void handleDeleteComment(comment._id)}
                                className="bg-[#DC2626] hover:bg-[#B91C1C] disabled:opacity-60 text-white px-2 py-1 text-[11px] font-semibold rounded-lg cursor-pointer"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteCommentId(null)}
                                className="border border-[#CBD5E1] px-2 py-1 text-[11px] text-[#475569] rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteCommentId(comment._id)}
                              aria-label="Delete comment"
                              className="border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] p-1.5 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-6 py-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
              <button
                type="button"
                onClick={() => setCommentsModalOpen(false)}
                className="bg-[#0F172A] hover:bg-[#1E293B] text-white px-4 py-2 text-[12px] font-semibold rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogsView;
