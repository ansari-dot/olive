import React, { useState, useMemo, useEffect } from 'react';
import { BlogPost } from '../data/storeData';
import { fetchBlogs } from '../services/api';
import { Loader2 } from 'lucide-react';

interface BlogsPageProps {
  posts?: BlogPost[];
  onSelectPost: (post: BlogPost) => void;
  onNavigateHome: () => void;
  onNavigateShop: () => void;
}

const inferTopic = (post: BlogPost): string => {
  const lower = post.title.toLowerCase();
  if (lower.includes('health')) return 'Olive Health';
  if (lower.includes('superfood')) return 'Culinary';
  return 'Purity';
};

export const BlogsPage: React.FC<BlogsPageProps> = ({
  posts: initialPosts = [],
  onSelectPost,
  onNavigateHome,
  onNavigateShop,
}) => {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [loading, setLoading] = useState<boolean>(initialPosts.length === 0);
  const [selectedTopic, setSelectedTopic] = useState<string>('All');
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (initialPosts.length > 0) {
      setPosts(initialPosts);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    fetchBlogs()
      .then((data) => {
        if (isMounted) setPosts(data);
      })
      .catch((err) => {
        console.error('Failed to load blog posts:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [initialPosts]);

  const topics = useMemo(() => {
    const unique = Array.from(new Set(posts.map(inferTopic)));
    return ['All', ...unique];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (selectedTopic === 'All') return posts;
    return posts.filter((post) => inferTopic(post) === selectedTopic);
  }, [posts, selectedTopic]);

  return (
    <main className="w-full bg-white py-10 sm:py-12 lg:py-14">
      <div className="max-w-[1220px] mx-auto px-6 sm:px-10 lg:px-14">
        {/* Top Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8 text-[12.5px] text-[#777777]">
          <button
            type="button"
            onClick={onNavigateHome}
            className="hover:text-[#181818] transition-colors cursor-pointer"
          >
            Home
          </button>
          <span className="mx-1.5" aria-hidden="true">
            /
          </span>
          <span className="text-[#444444]">Blogs</span>
        </nav>

        {/* Clean Header & Topic Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 mb-10 border-b border-[#EAEAEA]">
          <div>
            <p className="text-[11.5px] uppercase tracking-[0.12em] text-[#C46B3B] font-semibold mb-1.5">
              Orchard Journal
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-normal text-[#181818] leading-tight">
              Harvest Stories &amp; Guides
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            {topics.map((topic) => {
              const isActive = selectedTopic === topic;
              return (
                <button
                  key={topic}
                  type="button"
                  onClick={() => setSelectedTopic(topic)}
                  className={`text-[12px] uppercase tracking-[0.08em] pb-1 border-b transition-colors cursor-pointer ${
                    isActive
                      ? 'text-[#181818] border-[#181818] font-semibold'
                      : 'text-[#666666] border-transparent hover:text-[#181818]'
                  }`}
                >
                  {topic}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Editorial Article Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="animate-pulse flex flex-col">
                <div className="aspect-[4/2.9] w-full bg-[#F3EFEA]" />
                <div className="mt-4 space-y-2">
                  <div className="h-4 bg-[#EFEBE5] w-3/4" />
                  <div className="h-3 bg-[#EFEBE5] w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-16 text-center border border-[#EAEAEA] bg-[#FAF9F6]">
            <p className="text-[15px] text-[#444444]">No stories found in this category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-7 lg:gap-8">
            {filteredPosts.map((post) => {
              const isBroken = brokenImages[post.id];
              return (
                <article key={post.id} className="group flex flex-col">
                  <button
                    type="button"
                    onClick={() => onSelectPost(post)}
                    className="relative aspect-[4/2.9] w-full bg-[#FAF3F0] overflow-hidden text-left cursor-pointer"
                  >
                    <div className="absolute top-0 left-0 z-10 w-[50px] h-[50px] bg-[#0B0B0B] text-white flex flex-col items-center justify-center leading-tight tabular-nums">
                      <span className="text-[15px] font-normal">{post.day}</span>
                      <span className="text-[12px] font-normal text-white/90">{post.month}</span>
                    </div>

                    {!isBroken ? (
                      <img
                        src={post.image}
                        alt={post.alt}
                        referrerPolicy="no-referrer"
                        onError={() =>
                          setBrokenImages((prev) => ({ ...prev, [post.id]: true }))
                        }
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-6 text-center text-[#15472B]">
                        <span className="font-serif-brand text-base">{post.title}</span>
                      </div>
                    )}
                  </button>

                  <div className="mt-4 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] uppercase tracking-[0.08em] text-[#C46B3B] font-semibold mb-1">
                        {inferTopic(post)} · {post.readTime}
                      </p>
                      <h2 className="text-[17px] font-normal text-[#181818] leading-snug">
                        <button
                          type="button"
                          onClick={() => onSelectPost(post)}
                          className="hover:text-[#15472B] transition-colors cursor-pointer text-left"
                        >
                          {post.title}
                        </button>
                      </h2>
                      <p className="mt-2 text-[13.5px] leading-[1.65] text-[#555555] line-clamp-3">
                        {post.excerpt}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F0F0F0]">
                      <button
                        type="button"
                        onClick={() => onSelectPost(post)}
                        className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-[#181818] hover:text-[#15472B] transition-colors cursor-pointer"
                      >
                        Read Harvest Article &rarr;
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};
