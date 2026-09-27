'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Search, X, Sparkles } from 'lucide-react';
import ProductGrid from '@/components/home/ProductGrid';
import { getCatalog } from '@/lib/api';

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(Boolean(initialQuery.trim()));

  useEffect(() => {
    const qFromUrl = searchParams.get('q');
    if (qFromUrl !== null && qFromUrl !== undefined && qFromUrl !== query) {
      setQuery(qFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!query.trim()) {
      setItems([]);
      setSearched(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setSearched(true);
      try {
        const res = await getCatalog({ search: query.trim() });
        const list = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
        setItems(list);
      } catch (err) {
        console.error('Search error:', err);
        setItems([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const quickSearchTags = [
    { label: 'Kandipappu (Toor Dal)', query: 'kandipappu' },
    { label: 'Pesarapappu (Moong)', query: 'pesarapappu' },
    { label: 'Biyyam (Rice)', query: 'biyyam' },
    { label: 'Bellam (Jaggery)', query: 'bellam' },
    { label: 'Pasupu (Haldi)', query: 'pasupu' },
    { label: 'Cheepiri (Broom)', query: 'cheepiri' },
    { label: 'Sunflower Oil', query: 'sunflower oil' },
    { label: 'Atta', query: 'atta' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Search Header Bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-700 cursor-pointer"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search in English, Telugu, or Hindi (e.g. Kandipappu, Rice, Oil)..."
              className="w-full bg-gray-100 pl-10 pr-9 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:bg-white transition border border-transparent focus:border-[#0C831F]"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5">
        {!searched ? (
          <div className="max-w-xl mx-auto py-12 text-center">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto text-[#0C831F] mb-3">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Search Jyothi Mart</h3>
            <p className="text-xs text-gray-500 mb-6">
              Search across 1,500+ items using English, Telugu, or Hindi names
            </p>

            {/* Quick Telugu / Popular tags */}
            <div className="text-left bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2.5">
                Popular & Regional Searches
              </span>
              <div className="flex flex-wrap gap-2">
                {quickSearchTags.map((tag) => (
                  <button
                    key={tag.query}
                    onClick={() => setQuery(tag.query)}
                    className="text-xs bg-gray-50 hover:bg-emerald-50 hover:text-[#0C831F] text-gray-700 font-semibold px-3 py-1.5 rounded-xl border border-gray-200 transition cursor-pointer"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Search Results for &quot;{query}&quot;
              </span>
              <span className="text-xs text-[#0C831F] font-bold">
                {items.length} {items.length === 1 ? 'result' : 'results'}
              </span>
            </div>
            <ProductGrid items={items} loading={loading} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50" />}>
      <SearchContent />
    </Suspense>
  );
}
