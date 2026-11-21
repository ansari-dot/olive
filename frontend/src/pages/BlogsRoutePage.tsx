import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BlogsPage } from '../components/BlogsPage';
import { fetchBlogs } from '../services/api';
import { BlogPost } from '../data/storeData';

export const BlogsRoutePage: React.FC = () => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchBlogs()
      .then((res) => {
        if (isMounted) setPosts(res);
      })
      .catch(console.error);

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <BlogsPage
      posts={posts}
      onSelectPost={(post) => navigate(`/blogs/${post.slug || post.id}`)}
      onNavigateHome={() => navigate('/')}
      onNavigateShop={() => navigate('/shop')}
    />
  );
};

export default BlogsRoutePage;
