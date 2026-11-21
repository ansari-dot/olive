import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { BlogDetailPage } from '../components/BlogDetailPage';
import { useStore } from '../context/StoreContext';
import { fetchBlogById, fetchBlogs, fetchProducts } from '../services/api';
import { BlogPost, Product } from '../data/storeData';
import { Loader2, ArrowLeft } from 'lucide-react';

export const BlogDetailRoutePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useStore();

  const [post, setPost] = useState<BlogPost | null>(null);
  const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      fetchBlogById(id),
      fetchBlogs(),
      fetchProducts({ limit: 4 }),
    ])
      .then(([singlePost, allBlogs, prodRes]) => {
        if (!isMounted) return;
        setPost(singlePost);
        setRelatedPosts(allBlogs.filter((b) => b.id !== singlePost.id && b.slug !== singlePost.slug));
        setFeaturedProducts(prodRes.products || []);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load blog detail:', err);
        setError('Article not found.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] max-w-[1240px] mx-auto px-4 py-16 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-[#15472B] animate-spin" />
        <p className="text-sm text-[#475569] font-medium">Loading harvest journal article...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="w-full min-h-[50vh] max-w-[1240px] mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-[#15472B]">Article Not Found</h2>
        <p className="text-sm text-[#64748B] max-w-md mx-auto">
          {error || 'This journal article is currently unavailable.'}
        </p>
        <button
          type="button"
          onClick={() => navigate('/blogs')}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xs bg-[#15472B] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#0E341E] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Journal
        </button>
      </div>
    );
  }

  return (
    <BlogDetailPage
      post={post}
      relatedPosts={relatedPosts}
      featuredProducts={featuredProducts}
      onSelectPost={(p) => navigate(`/blogs/${p.slug || p.id}`)}
      onSelectProduct={(p) => navigate(`/product/${p.slug || p.id}`)}
      onAddToCart={addToCart}
      onNavigateHome={() => navigate('/')}
      onNavigateBlogs={() => navigate('/blogs')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default BlogDetailRoutePage;
