'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  Pencil,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { BLOG_IMAGES } from '@/lib/assets';
import {
  BLOG_CATEGORIES,
  FIELD_LIMITS,
  type BlogCategory,
  type BlogImageKey,
  type BlogPost,
} from '@/lib/types';
import { usePharmacy } from './FirebaseContext';

export default function BlogView() {
  const {
    isAdmin,
    blogs,
    allBlogsAdmin,
    saveBlogPost,
    deleteBlogPost,
    setActiveRoute,
  } = usePharmacy();

  const [selectedCategory, setSelectedCategory] = useState<'All' | BlogCategory>('All');
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Admin inline Blog Create / Edit Modal
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>(undefined);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Preventive Care');
  const [authorName, setAuthorName] = useState('Dr. Ananya Kulkarni, PharmD');
  const [readTime, setReadTime] = useState('4 min read');
  const [imageKey, setImageKey] = useState<BlogImageKey>('pharmacist');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Admin sees drafts + published; public sees published
  const visibleSource = isAdmin ? allBlogsAdmin : blogs;

  const filteredBlogs = useMemo(() => {
    if (selectedCategory === 'All') return visibleSource;
    return visibleSource.filter((b) => b.category === selectedCategory);
  }, [visibleSource, selectedCategory]);

  const openCreateModal = () => {
    setEditingId(undefined);
    setTitle('');
    setCategory('Preventive Care');
    setAuthorName('Dr. Ananya Kulkarni, PharmD');
    setReadTime('4 min read');
    setImageKey('pharmacist');
    setExcerpt('');
    setContent('');
    setPublished(true);
    setEditorOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
    setEditingId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setAuthorName(post.authorName);
    setReadTime(post.readTime);
    setImageKey(post.imageKey);
    setExcerpt(post.excerpt);
    setContent(post.content);
    setPublished(post.published);
    setActivePost(null);
    setEditorOpen(true);
  };

  const handleSaveBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSaving(true);
    try {
      await saveBlogPost(
        {
          title,
          category,
          excerpt,
          content,
          authorName,
          readTime,
          imageKey,
          published,
        },
        editingId
      );
      setEditorOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to save article.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBlog = async (id: string) => {
    await deleteBlogPost(id);
    setConfirmDeleteId(null);
    if (activePost?.id === id) setActivePost(null);
  };

  return (
    <div className="max-w-[1360px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 pb-6 border-b border-[#DCE5DF]">
        <div>
          <p className="text-xs font-medium text-[#1F5E3B] mb-1.5">
            Clinical Insights &amp; Lifestyle Guides
          </p>
          <h1
            className="text-3xl font-semibold text-[#132A1E]"
            style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
          >
            Wellness Forever Health Journal
          </h1>
          <p className="text-sm text-[#4E6157] mt-1">
            Pharmacist-authored guidance on medication safety, daily nutrition, and preventive wellness
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 min-w-0 w-full lg:w-auto">
          {isAdmin && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] whitespace-nowrap cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Blog Article
            </button>
          )}
          <div className="flex items-center gap-1 p-1 bg-[#EDF2EE] rounded-lg overflow-x-auto max-w-full min-w-0">
            {(['All', ...BLOG_CATEGORIES] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-white text-[#1F5E3B] shadow-sm font-semibold'
                    : 'text-[#4E6157] hover:text-[#132A1E]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="mt-5 p-4 rounded-xl bg-[#EAF3ED] border border-[#BBD8C5] flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#132A1E]">
            <strong>Admin Blog CRUD Active:</strong> Create, edit, publish, or delete health articles directly below or inside the Admin Panel.
          </p>
          <button
            type="button"
            onClick={() => setActiveRoute('admin')}
            className="text-xs font-semibold text-[#1F5E3B] hover:underline cursor-pointer"
          >
            Open Full Admin Console →
          </button>
        </div>
      )}

      {filteredBlogs.length === 0 ? (
        <div className="mt-8 bg-white border border-[#DCE5DF] rounded-2xl p-12 text-center">
          <BookOpen className="w-8 h-8 text-[#6E8276] mx-auto mb-3" />
          <p className="text-base font-semibold text-[#132A1E]">
            No articles in this category yet
          </p>
          <p className="text-sm text-[#4E6157] mt-1">
            Check back soon or select another topic above.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBlogs.map((post) => (
            <article
              key={post.id}
              className="bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <button
                type="button"
                onClick={() => setActivePost(post)}
                className="relative aspect-[4/3] w-full bg-[#F1F5F2] overflow-hidden cursor-pointer"
              >
                <Image
                  src={BLOG_IMAGES[post.imageKey]}
                  alt={post.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
              </button>

              <div className="p-6 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#4E6157]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#1F5E3B]">
                        {post.category}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{post.readTime}</span>
                    </div>
                    {isAdmin && !post.published && (
                      <span className="text-[11px] font-semibold text-[#B45309]">
                        Draft
                      </span>
                    )}
                  </div>
                  <h2
                    className="text-lg font-semibold text-[#132A1E] mt-2 leading-snug"
                    style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm text-[#4E6157] mt-2 line-clamp-3 leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#EDF2EE] space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-[#4E6157] truncate">
                      {post.authorName}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActivePost(post)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#1F5E3B] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Read Article</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {isAdmin && (
                    <div className="pt-2 border-t border-[#F1F5F2] flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(post)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#DCE5DF] text-xs font-medium text-[#1F5E3B] hover:bg-[#EAF3ED] cursor-pointer"
                      >
                        <Pencil className="w-3 h-3" />
                        Edit
                      </button>
                      {confirmDeleteId === post.id ? (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDeleteBlog(post.id)}
                            className="px-2.5 py-1 rounded-md bg-[#B91C1C] text-white text-xs font-semibold cursor-pointer"
                          >
                            Confirm Delete
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-md border border-[#DCE5DF] text-xs text-[#4E6157] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(post.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#FECACA] text-xs font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {/* Article Reader Modal */}
      <AnimatePresence>
        {activePost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePost(null)}
              className="fixed inset-0 bg-[#0E2417]/40 backdrop-blur-[2px]"
            />
            <motion.article
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.16 }}
              className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="relative h-56 sm:h-64 w-full bg-[#F1F5F2] shrink-0">
                <Image
                  src={BLOG_IMAGES[activePost.imageKey]}
                  alt={activePost.title}
                  fill
                  referrerPolicy="no-referrer"
                  className="object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActivePost(null)}
                  aria-label="Close article"
                  className="absolute top-4 right-4 w-9 h-9 rounded-lg bg-white/95 text-[#132A1E] flex items-center justify-center border border-[#DCE5DF] hover:bg-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-6 sm:p-8 overflow-y-auto space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#4E6157]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[#1F5E3B]">
                      {activePost.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{activePost.readTime}</span>
                    <span aria-hidden="true">·</span>
                    <span>{activePost.authorName}</span>
                  </div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => openEditModal(activePost)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-[#DCE5DF] text-xs font-semibold text-[#1F5E3B] hover:bg-[#EAF3ED] cursor-pointer"
                    >
                      <Pencil className="w-3 h-3" />
                      Edit Article
                    </button>
                  )}
                </div>
                <h2
                  className="text-2xl font-semibold text-[#132A1E] leading-snug"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  {activePost.title}
                </h2>
                <div className="space-y-4 text-[15px] text-[#3D5245] leading-relaxed whitespace-pre-line">
                  {activePost.content}
                </div>
              </div>
            </motion.article>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Blog Create / Edit Modal */}
      <AnimatePresence>
        {editorOpen && isAdmin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditorOpen(false)}
              className="fixed inset-0 bg-[#0E2417]/45 backdrop-blur-[2px]"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              className="relative z-10 max-w-2xl w-full max-h-[90vh] bg-white border border-[#DCE5DF] rounded-2xl overflow-hidden flex flex-col shadow-2xl"
            >
              <div className="px-6 py-4 border-b border-[#DCE5DF] flex items-center justify-between">
                <h3
                  className="text-lg font-semibold text-[#132A1E]"
                  style={{ fontFamily: 'var(--font-display), Georgia, serif' }}
                >
                  {editingId ? 'Edit Health Article' : 'Create Health Article'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditorOpen(false)}
                  className="w-8 h-8 rounded-lg border border-[#DCE5DF] flex items-center justify-center text-[#4E6157] hover:bg-[#F1F5F2] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form
                onSubmit={handleSaveBlog}
                className="p-6 overflow-y-auto space-y-4"
              >
                {formError && (
                  <div className="p-3 rounded-lg border border-[#FCA5A5] bg-[#FEF2F2] text-xs text-[#991B1B]">
                    {formError}
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-[#132A1E] mb-1">
                    Article Title *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={2}
                    maxLength={FIELD_LIMITS.blogTitleMax}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm focus:outline-none focus:border-[#1F5E3B]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as BlogCategory)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm bg-white"
                    >
                      {BLOG_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Cover Visual
                    </label>
                    <select
                      value={imageKey}
                      onChange={(e) => setImageKey(e.target.value as BlogImageKey)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm bg-white"
                    >
                      <option value="pharmacist">Pharmacist Consultation</option>
                      <option value="vitamins">Nutrition &amp; Vitamins</option>
                      <option value="derma">Skin &amp; Wellness</option>
                      <option value="prescription">Medication Safety</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Author Name *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#132A1E] mb-1">
                      Read Time *
                    </label>
                    <input
                      type="text"
                      required
                      minLength={2}
                      maxLength={30}
                      value={readTime}
                      onChange={(e) => setReadTime(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#132A1E] mb-1">
                    Summary Excerpt *
                  </label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    maxLength={FIELD_LIMITS.blogExcerptMax}
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#DCE5DF] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#132A1E] mb-1">
                    Article Body *
                  </label>
                  <textarea
                    rows={5}
                    required
                    minLength={5}
                    maxLength={FIELD_LIMITS.blogContentMax}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[#DCE5DF] text-sm"
                  />
                </div>
                <label className="flex items-center gap-2 text-xs font-medium text-[#132A1E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={published}
                    onChange={(e) => setPublished(e.target.checked)}
                  />
                  Published on public Health Blog
                </label>
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-lg bg-[#1F5E3B] text-white text-xs font-semibold hover:bg-[#17482D] disabled:opacity-60 cursor-pointer"
                  >
                    {saving ? 'Saving...' : editingId ? 'Update Article' : 'Publish Article'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditorOpen(false)}
                    className="px-4 py-2.5 rounded-lg border border-[#DCE5DF] text-xs font-medium text-[#4E6157] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
