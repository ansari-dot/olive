import React, { useState } from 'react';
import { X } from 'lucide-react';
import { BlogPost } from '../data/storeData';

interface FromOurBlogSectionProps {
  posts: BlogPost[];
  onSelectPost?: (post: BlogPost) => void;
  onViewAllBlogs?: () => void;
}

export const FromOurBlogSection: React.FC<FromOurBlogSectionProps> = ({
  posts,
  onSelectPost,
  onViewAllBlogs,
}) => {
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const handleOpenPost = (post: BlogPost) => {
    if (onSelectPost) {
      onSelectPost(post);
      return;
    }
    setSelectedPost(post);
  };

  return (
    <section
      id="from-our-blog"
      aria-labelledby="from-our-blog-heading"
      className="w-full bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Centered Heading & Subtitle */}
        <div className="text-center max-w-[640px] mx-auto mb-12 lg:mb-14">
          <h2
            id="from-our-blog-heading"
            className="text-[32px] sm:text-[38px] lg:text-[42px] font-normal tracking-[-0.01em] text-[#111111] leading-tight"
          >
            From Our Blog
          </h2>
          <p className="mt-2.5 text-[14.5px] sm:text-[15px] text-[#6E6A66] font-normal leading-relaxed">
            Harvest journals, nutrition notes, and cold-press quality standards from our groves.
          </p>
        </div>

        {/* 3-Column Editorial Article Grid */}
        {posts && posts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8">
          {posts.map((post) => {
            const isBroken = brokenImages[post.id];
            return (
              <article key={post.id} className="group flex flex-col">
                {/* Article Cover with Top-Left Black Date Tile */}
                <button
                  type="button"
                  onClick={() => handleOpenPost(post)}
                  className="relative aspect-[4/2.75] w-full bg-[#EAE4DC] overflow-hidden text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                >
                  <div className="absolute top-0 left-0 z-10 w-[52px] h-[52px] bg-[#0B0B0B] text-white flex flex-col items-center justify-center leading-tight tabular-nums">
                    <span className="text-[15px] font-normal">{post.day}</span>
                    <span className="text-[12.5px] font-normal text-white/90">{post.month}</span>
                  </div>

                  {!isBroken ? (
                    <img
                      src={post.image}
                      alt={post.alt}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setBrokenImages((prev) => ({ ...prev, [post.id]: true }))
                      }
                      className="w-full h-full object-cover object-center transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B]">
                      <span className="font-serif-brand text-lg">{post.title}</span>
                    </div>
                  )}
                </button>

                {/* Title with subtle hover underline */}
                <h3 className="mt-5 text-[20px] sm:text-[21px] font-normal text-[#141414] leading-snug">
                  <button
                    type="button"
                    onClick={() => handleOpenPost(post)}
                    className="text-left group-hover:underline underline-offset-[5px] decoration-[1.2px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#15472B]"
                  >
                    {post.title}
                  </button>
                </h3>

                {/* Excerpt */}
                <p className="mt-3 text-[13.5px] sm:text-[14px] text-[#666666] leading-[1.65]">
                  {post.excerpt}
                </p>

                {/* Terracotta READ MORE -> Link */}
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => handleOpenPost(post)}
                    className="inline-flex items-center gap-1.5 text-[11.5px] font-medium uppercase tracking-[0.1em] text-[#C46B3B] hover:text-[#9F4F24] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C46B3B]"
                  >
                    <span>READ MORE</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="w-full py-12 text-center border border-dashed border-[#E5E7EB] bg-[#FAF8F5] rounded-xs">
          <p className="text-[14px] font-semibold text-[#4B5563]">No stories yet published</p>
          <p className="text-[12px] text-[#9CA3AF] mt-1">Journal stories from our groves will be posted soon.</p>
        </div>
      )}

        {onViewAllBlogs && (
          <div className="mt-11 text-center">
            <button
              type="button"
              onClick={onViewAllBlogs}
              className="inline-flex items-center gap-2 border border-[#181818] bg-white hover:bg-[#181818] hover:text-white text-[#181818] text-[11.5px] font-semibold uppercase tracking-[0.09em] px-7 py-3 transition-colors cursor-pointer"
            >
              <span>VIEW ALL BLOGS</span>
              <span aria-hidden="true">&rarr;</span>
            </button>
          </div>
        )}
      </div>

      {/* Article Reader Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-modal-title"
        >
          <div className="w-full max-w-[640px] bg-white border border-[#EAEAEA] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="relative h-[220px] sm:h-[260px] bg-[#EAE4DC] shrink-0">
              <img
                src={selectedPost.image}
                alt={selectedPost.alt}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedPost(null)}
                aria-label="Close article"
                className="absolute top-3 right-3 w-9 h-9 bg-white/90 hover:bg-white text-[#181818] flex items-center justify-center cursor-pointer shadow-sm"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 sm:p-8 overflow-y-auto">
              <p className="text-[12px] text-[#666666]">
                {selectedPost.day} {selectedPost.month} · {selectedPost.readTime}
              </p>
              <h3
                id="blog-modal-title"
                className="mt-2 text-[24px] sm:text-[28px] font-normal text-[#141414] leading-snug"
              >
                {selectedPost.title}
              </h3>
              <div className="mt-4 space-y-4 text-[14.5px] leading-[1.7] text-[#555555]">
                {selectedPost.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
