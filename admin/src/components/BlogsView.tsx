import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  X,
  Upload,
  RefreshCw,
  BookOpen,
} from 'lucide-react';
import {
  createAdminBlog,
  deleteAdminBlog,
  fetchAdminBlogs,
  resolveAssetUrl,
  updateAdminBlog,
  uploadAdminImage,
} from '../services/adminApi';
import type { AdminBlogPost } from '../types/admin';

interface BlogFormState {
  title: string;
  slug: string;
  day: string;
  month: string;
  readTime: string;
  excerpt: string;
  image: string;
  alt: string;
  contentText: string;
  isPublished: boolean;
}

const EMPTY_BLOG_FORM: BlogFormState = {
  title: '',
  slug: '',
  day: String(new Date().getDate()).padStart(2, '0'),
  month: new Date().toLocaleString('en-US', { month: 'short' }).toUpperCase(),
  readTime: '4 min read',
  excerpt: '',
  image: '',
  alt: '',
  contentText: '',
  isPublished: true,
};

const toSlug = (text: string): string =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');

export const BlogsView: React.FC = () => {
  const [blogs, setBlogs] = useState<AdminBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BlogFormState>(EMPTY_BLOG_FORM);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Two-step inline delete state
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchAdminBlogs();
      setBlogs(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Orchard Journal posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadBlogs();
  }, []);

  const openCreateModal = () => {
    setEditingId(null);
    setForm(EMPTY_BLOG_FORM);
    setModalOpen(true);
  };

  const openEditModal = (post: AdminBlogPost) => {
    setEditingId(post._id);
    setForm({
      title: post.title,
      slug: post.slug,
      day: post.day,
      month: post.month,
      readTime: post.readTime,
      excerpt: post.excerpt,
      image: post.image,
      alt: post.alt || post.title,
      contentText: (post.content || []).join('\n\n'),
      isPublished: post.isPublished ?? true,
    });
    setModalOpen(true);
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadAdminImage(file);
      setForm((prev) => ({ ...prev, image: url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload cover image.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const paragraphs = form.contentText
        .split(/\n{2,}/)
        .map((p) => p.trim())
        .filter(Boolean);

      const payload: Partial<AdminBlogPost> = {
        title: form.title.trim(),
        slug: (form.slug.trim() || toSlug(form.title)).toLowerCase(),
        day: form.day.trim(),
        month: form.month.trim().toUpperCase(),
        readTime: form.readTime.trim(),
        excerpt: form.excerpt.trim(),
        image: form.image.trim(),
        alt: form.alt.trim() || form.title.trim(),
        content: paragraphs,
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
      setError(err instanceof Error ? err.message : 'Failed to save journal post.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    setError(null);
    try {
      await deleteAdminBlog(id);
      setConfirmDeleteId(null);
      await loadBlogs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete post.');
    } finally {
      setDeletingId(null);
    }
  };

  const filteredBlogs = blogs.filter((b) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      b.title.toLowerCase().includes(q) ||
      b.slug.toLowerCase().includes(q) ||
      b.excerpt.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#0F172A]">
            Orchard Journal CMS
          </h2>
          <p className="text-[13px] text-[#64748B] font-mono-data">
            {blogs.length} editorial articles
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter articles..."
            className="w-[210px] border border-[#CBD5E1] bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-[#15472B]"
          />
          <button
            type="button"
            onClick={() => void loadBlogs()}
            aria-label="Refresh articles"
            className="border border-[#CBD5E1] bg-white hover:border-[#0F172A] p-2 text-[#334155] cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-[#15472B] hover:bg-[#0F3620] text-white px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.06em] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Article</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-[#B91C1C]">
          {error}
        </div>
      )}

      <div className="bg-white border border-[#E2E8F0] overflow-x-auto">
        {loading && blogs.length === 0 ? (
          <div className="p-8 text-center text-[13.5px] text-[#64748B]">
            Loading Orchard Journal articles...
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="p-12 text-center text-[14px] text-[#64748B]">
            No journal articles found.
          </div>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-[0.06em] text-[#64748B] bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-3 px-4 text-left font-semibold">Article</th>
                <th className="py-3 px-4 text-left font-semibold">Date Stamp</th>
                <th className="py-3 px-4 text-left font-semibold">Read Time</th>
                <th className="py-3 px-4 text-left font-semibold">Visibility</th>
                <th className="py-3 px-4 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredBlogs.map((post) => (
                <tr key={post._id} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3 min-w-[260px]">
                      {post.image ? (
                        <img
                          src={resolveAssetUrl(post.image)}
                          alt={post.alt || post.title}
                          referrerPolicy="no-referrer"
                          className="w-14 h-10 object-cover bg-[#FAF3F0] shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-10 bg-[#F1F5F9] flex items-center justify-center shrink-0">
                          <BookOpen className="w-4 h-4 text-[#94A3B8]" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-[#0F172A] truncate max-w-[340px]">
                          {post.title}
                        </p>
                        <p className="text-[11.5px] text-[#64748B] font-mono-data truncate max-w-[340px]">
                          /blog/{post.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono-data text-[#334155] whitespace-nowrap">
                    {post.day} {post.month}
                  </td>
                  <td className="py-3 px-4 font-mono-data text-[#475569] whitespace-nowrap">
                    {post.readTime}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`font-medium ${
                        post.isPublished ? 'text-[#16A34A]' : 'text-[#64748B]'
                      }`}
                    >
                      {post.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="border border-[#CBD5E1] hover:border-[#0F172A] px-2.5 py-1.5 text-[11.5px] font-medium text-[#0F172A] inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {confirmDeleteId === post._id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            disabled={deletingId === post._id}
                            onClick={() => void handleDelete(post._id)}
                            className="bg-[#DC2626] hover:bg-[#B91C1C] text-white px-2.5 py-1.5 text-[11px] font-semibold cursor-pointer"
                          >
                            {deletingId === post._id ? 'Deleting...' : 'Confirm'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="border border-[#CBD5E1] px-2 py-1.5 text-[11px] text-[#475569] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post._id)}
                          aria-label={`Delete ${post.title}`}
                          className="border border-[#FECACA] hover:bg-[#FEF2F2] text-[#DC2626] p-1.5 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create / Edit Blog Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-[740px] max-h-[92vh] bg-white border border-[#E2E8F0] flex flex-col">
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-[#0F172A]">
                {editingId ? 'Edit Journal Article' : 'Publish Orchard Journal Article'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Close modal"
                className="p-1.5 text-[#64748B] hover:text-[#0F172A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setForm((prev) => ({
                        ...prev,
                        title: nextTitle,
                        slug: editingId ? prev.slug : toSlug(nextTitle),
                      }));
                    }}
                    placeholder="Potohar Autumn Harvest & Cold-Press Lab Report"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    URL Slug *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                    placeholder="potohar-autumn-harvest-lab-report"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Day *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.day}
                    onChange={(e) => setForm((p) => ({ ...p, day: e.target.value }))}
                    placeholder="14"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Month *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.month}
                    onChange={(e) => setForm((p) => ({ ...p, month: e.target.value }))}
                    placeholder="OCT"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data uppercase"
                  />
                </div>
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Read Time *
                  </label>
                  <input
                    type="text"
                    required
                    value={form.readTime}
                    onChange={(e) => setForm((p) => ({ ...p, readTime: e.target.value }))}
                    placeholder="5 min read"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                  Short Excerpt *
                </label>
                <textarea
                  rows={2}
                  required
                  value={form.excerpt}
                  onChange={(e) => setForm((p) => ({ ...p, excerpt: e.target.value }))}
                  placeholder="Summary shown on the Orchard Journal cards..."
                  className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Cover Image URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={form.image}
                      onChange={(e) => setForm((p) => ({ ...p, image: e.target.value }))}
                      placeholder="/uploads/... or https://..."
                      className="flex-1 border border-[#CBD5E1] px-3 py-2 text-[13px] font-mono-data"
                    />
                    <label className="border border-[#CBD5E1] hover:border-[#0F172A] px-3 py-2 text-[12px] font-medium text-[#0F172A] inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploading ? '...' : 'Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                    Image Alt Text
                  </label>
                  <input
                    type="text"
                    value={form.alt}
                    onChange={(e) => setForm((p) => ({ ...p, alt: e.target.value }))}
                    placeholder="Olive orchard harvest in Chakwal"
                    className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11.5px] uppercase tracking-[0.06em] font-semibold text-[#475569] mb-1">
                  Article Body (Separate paragraphs with a blank line) *
                </label>
                <textarea
                  rows={7}
                  required
                  value={form.contentText}
                  onChange={(e) => setForm((p) => ({ ...p, contentText: e.target.value }))}
                  placeholder="Write paragraph 1 here...&#10;&#10;Write paragraph 2 here..."
                  className="w-full border border-[#CBD5E1] px-3 py-2 text-[13px] leading-relaxed"
                />
              </div>

              <label className="inline-flex items-center gap-2 text-[13px] text-[#0F172A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublished}
                  onChange={(e) => setForm((p) => ({ ...p, isPublished: e.target.checked }))}
                />
                <span>Published on public storefront</span>
              </label>

              <div className="pt-4 border-t border-[#E2E8F0] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="border border-[#CBD5E1] px-4 py-2 text-[12px] font-medium text-[#475569] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploading}
                  className="bg-[#15472B] hover:bg-[#0F3620] disabled:opacity-60 text-white px-5 py-2 text-[12px] font-semibold uppercase tracking-[0.07em] cursor-pointer"
                >
                  {saving ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
