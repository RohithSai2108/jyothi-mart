'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getCategories, getCachedData } from '@/lib/api';
import { ChevronRight, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const CATEGORY_COLORS = [
  'bg-emerald-50 text-emerald-700 border-emerald-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-blue-50 text-blue-700 border-blue-200',
  'bg-purple-50 text-purple-700 border-purple-200',
  'bg-orange-50 text-orange-700 border-orange-200',
  'bg-rose-50 text-rose-700 border-rose-200',
  'bg-cyan-50 text-cyan-700 border-cyan-200',
  'bg-lime-50 text-lime-700 border-lime-200',
  'bg-indigo-50 text-indigo-700 border-indigo-200',
];

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCategories = async (forceRefresh = false) => {
    if (forceRefresh) setLoading(true);
    setError(null);
    try {
      const res = await getCategories(forceRefresh, null, 5000);
      const freshList = res.data?.data || res.data || [];
      if (Array.isArray(freshList) && freshList.length > 0) {
        setCategories(freshList);
      } else if (categories.length === 0) {
        setError('Categories took too long to load');
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
      if (categories.length === 0) {
        setError('Loading timed out (5s limit). Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately hydrate from cache on client mount
    const cached = getCachedData('categories');
    const list = cached?.data || cached || [];
    if (Array.isArray(list) && list.length > 0) {
      setCategories(list);
      setLoading(false);
    }

    // 2. Fetch fresh data with 5s timeout
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="p-2 hover:bg-gray-100 rounded-full transition text-gray-700 cursor-pointer"
            aria-label="Back to home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">All Categories</h1>
            <p className="text-xs text-gray-500">Explore groceries & essentials by department</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 mt-6">
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-500 bg-white rounded-2xl border border-gray-200 p-6">
            <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-700">
              {error || 'No categories available at this moment'}
            </p>
            {error && (
              <button
                onClick={() => loadCategories(true)}
                className="mt-4 px-4 py-2 bg-[#0C831F] text-white text-xs font-bold rounded-xl hover:bg-green-700 transition"
              >
                Retry Loading
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
            {categories.map((cat, idx) => {
              const colorClass = CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
              return (
                <Link
                  key={cat._id}
                  href={`/category/${cat._id}`}
                  className="group bg-white rounded-2xl p-4 border border-gray-200 hover:border-[#0C831F] hover:shadow-md transition flex flex-col justify-between h-36"
                >
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base bg-[#F4F6FB] border border-gray-100 overflow-hidden p-1">
                      {cat.image ? (
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-contain" />
                      ) : (
                        <span className="text-[#0C831F] font-bold">{cat.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#0C831F] group-hover:translate-x-0.5 transition" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900 group-hover:text-[#0C831F] transition line-clamp-1">
                      {cat.name}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {cat.itemCount !== undefined ? `${cat.itemCount} items` : 'View items'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
