'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import { useCallback, useState, useEffect, useRef } from 'react';
import { getCatalog } from '@/lib/api';

export default function ShopByCategory({
  categories = [],
  loading = false,
  error = null,
  onRetry = null,
}) {
  const router = useRouter();
  const sectionRef = useRef(null);
  const [timeoutExceeded, setTimeoutExceeded] = useState(false);
  const [loadedImages, setLoadedImages] = useState({});

  // 2-Second (2000ms) Dynamic Timeout Guard
  useEffect(() => {
    let timer = null;
    if (loading && (!categories || categories.length === 0)) {
      timer = setTimeout(() => {
        setTimeoutExceeded(true);
      }, 2000);
    } else {
      setTimeoutExceeded(false);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [loading, categories]);

  // Prefetch category page JS bundle + warm the catalog data cache on hover
  const handleCategoryHover = useCallback(
    (catId) => {
      router.prefetch(`/category/${catId}`);
      // Silently warm the catalog cache for this category in the background
      getCatalog({ category: catId }).catch(() => {});
    },
    [router]
  );

  const handleImageLoad = (catId) => {
    setLoadedImages((prev) => ({ ...prev, [catId]: true }));
  };

  // Timeout fallback state after 2 seconds of loading without data
  if (timeoutExceeded && (!categories || categories.length === 0)) {
    return (
      <section ref={sectionRef} className="my-6 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5 text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="text-xs font-bold">Categories are taking longer than expected to load</p>
              <p className="text-[11px] text-amber-600">You may be experiencing a slow network connection.</p>
            </div>
          </div>
          {onRetry && (
            <button
              onClick={() => {
                setTimeoutExceeded(false);
                onRetry();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0C831F] text-white text-xs font-bold rounded-xl hover:bg-green-700 transition cursor-pointer active:scale-95 shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Now</span>
            </button>
          )}
        </div>
      </section>
    );
  }

  // Shimmer Skeleton while loading within 2s
  if (loading && (!categories || categories.length === 0)) {
    return (
      <div ref={sectionRef} className="my-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 w-44 bg-gray-200 rounded-lg animate-pulse" />
          <div className="h-4 w-16 bg-gray-200 rounded-lg animate-pulse" />
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-2 animate-pulse">
              <div className="w-full aspect-square bg-gray-200 rounded-2xl sm:rounded-3xl" />
              <div className="w-16 h-3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    if (error) {
      return (
        <div ref={sectionRef} className="my-6 p-4 rounded-2xl bg-gray-100 border border-gray-200 text-center">
          <p className="text-xs text-gray-600 font-medium">Unable to load categories right now.</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="mt-2 text-xs font-bold text-[#0C831F] hover:underline"
            >
              Tap to retry
            </button>
          )}
        </div>
      );
    }
    return null;
  }

  return (
    <section ref={sectionRef} className="my-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5 sm:mb-5">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <span>Shop by Category</span>
          </h2>
          <p className="text-xs text-gray-500 hidden sm:block mt-0.5">
            Explore fresh groceries, daily essentials &amp; household items
          </p>
        </div>
        <Link
          href="/category"
          className="text-xs sm:text-sm font-bold text-[#E53558] hover:text-[#C72041] flex items-center gap-0.5 transition group"
        >
          <span>See All</span>
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* Category Grid — Eager rendering, no lazy loading */}
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-2.5 sm:gap-3.5 md:gap-4">
        {categories.map((cat, index) => {
          const catId = cat._id || cat.id || cat.slug;
          const hasImage = Boolean(cat.image);
          const isImgLoaded = loadedImages[catId];

          return (
            <Link
              key={catId}
              href={`/category/${catId}`}
              prefetch={false}
              onMouseEnter={() => handleCategoryHover(catId)}
              onFocus={() => handleCategoryHover(catId)}
              onTouchStart={() => handleCategoryHover(catId)}
              className="group flex flex-col items-center text-center cursor-pointer select-none transition duration-200"
              style={{
                animationDelay: `${Math.min(index * 25, 400)}ms`,
              }}
            >
              {/* Card Container with Image */}
              <div className="w-full aspect-square bg-[#F4F6FB] group-hover:bg-[#EBF0FA] border border-gray-100 group-hover:border-purple-200 rounded-2xl sm:rounded-3xl p-2 sm:p-3 flex items-center justify-center relative overflow-hidden transition-all duration-300 shadow-2xs group-hover:shadow-md group-hover:-translate-y-1">
                {hasImage ? (
                  <>
                    {!isImgLoaded && (
                      <div className="absolute inset-0 bg-gray-100 animate-pulse rounded-2xl sm:rounded-3xl" />
                    )}
                    <img
                      src={cat.image}
                      alt={cat.name}
                      loading="eager"
                      decoding="async"
                      fetchPriority={index < 8 ? 'high' : 'auto'}
                      onLoad={() => handleImageLoad(catId)}
                      className={`w-full h-full object-contain group-hover:scale-108 transition-all duration-300 ${
                        isImgLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-emerald-50 text-[#0C831F] rounded-xl font-black text-xl sm:text-2xl group-hover:scale-108 transition-transform">
                    {cat.name?.charAt(0)?.toUpperCase() || 'C'}
                  </div>
                )}
              </div>

              {/* Category Name */}
              <span className="mt-2 text-[11px] sm:text-xs md:text-sm font-bold text-gray-800 group-hover:text-[#0C831F] line-clamp-2 leading-tight transition-colors">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

