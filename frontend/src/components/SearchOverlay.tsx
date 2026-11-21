import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Loader2 } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { fetchProducts } from '../services/api';
import { Product } from '../data/storeData';

const formatPKR = (amount: number) => `Rs. ${amount.toLocaleString('en-PK')}`;

export const SearchOverlay: React.FC = () => {
  const navigate = useNavigate();
  const { searchOverlayOpen, setSearchOverlayOpen, addToCart } = useStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [searching, setSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
      searchAbortRef.current = null;
    }

    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    const controller = new AbortController();
    searchAbortRef.current = controller;

    const timer = setTimeout(async () => {
      try {
        const res = await fetchProducts({ search: q, limit: 6 }, { signal: controller.signal });
        setResults(res.products);
      } catch (err: unknown) {
        if ((err as Error)?.name !== 'AbortError') {
          console.error('Search error:', err);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearching(false);
        }
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  if (!searchOverlayOpen) return null;

  const handleSelectProduct = (product: Product) => {
    setSearchOverlayOpen(false);
    navigate(`/product/${product.slug || product.id}`);
  };

  const handleViewAllResults = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchOverlayOpen(false);
    navigate(`/shop?search=${encodeURIComponent(query.trim())}`);
  };

  return (
    <div className="w-full bg-[#FAF9F6] border-b border-[#EAEAEA] py-4 px-4 sm:px-8 lg:px-14 shadow-md animate-in fade-in duration-150">
      <div className="max-w-[1380px] mx-auto space-y-3">
        <form onSubmit={handleViewAllResults} className="flex items-center gap-3">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search cold-pressed olive oil, Sidr honey, herbal teas..."
            autoFocus
            className="flex-1 bg-white border border-[#D4D4D4] px-4 py-2.5 text-[14px] text-[#1C1C1C] placeholder:text-[#767676] focus:outline-none focus:border-[#224D26]"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="px-3 py-2 text-[12px] uppercase tracking-[0.06em] text-[#555555] hover:text-[#121212] cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-2.5 bg-[#15472B] hover:bg-[#0F3620] text-white text-[12px] font-semibold uppercase tracking-[0.06em] cursor-pointer"
          >
            Search
          </button>
          <button
            type="button"
            onClick={() => setSearchOverlayOpen(false)}
            aria-label="Close search"
            className="p-2 text-[#444444] hover:text-black cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </form>

        {query.trim() && (
          <div className="bg-white border border-[#EAEAEA] divide-y divide-[#F0F0F0]">
            {searching ? (
              <div className="px-4 py-6 text-center text-[13.5px] text-[#666666] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#15472B]" />
                <span>Searching our orchard pantry...</span>
              </div>
            ) : results.length === 0 ? (
              <p className="px-4 py-3 text-[13.5px] text-[#555555]">
                No products matched &ldquo;{query}&rdquo;.
              </p>
            ) : (
              results.map((product) => (
                <div
                  key={product.id}
                  className="px-4 py-3 flex items-center justify-between gap-4"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectProduct(product)}
                    className="min-w-0 flex items-center gap-3.5 text-left cursor-pointer group flex-1"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-11 h-14 object-contain bg-[#FAF9F6] p-1 border border-[#EAEAEA] shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-[11px] uppercase tracking-[0.06em] text-[#666666]">
                        {product.brand} · {product.category}
                      </p>
                      <p className="text-[14px] font-medium text-[#181818] group-hover:text-[#15472B] truncate">
                        {product.name}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[13.5px] font-semibold tabular-nums text-[#181818]">
                      {formatPKR(product.price)}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(product)}
                      className="px-3 py-1.5 bg-[#1C1C1C] hover:bg-[#224D26] text-white text-[11.5px] uppercase tracking-[0.06em] cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
