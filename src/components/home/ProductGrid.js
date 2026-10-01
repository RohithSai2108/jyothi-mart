'use client';
import { useEffect, useRef, useState, useMemo } from 'react';
import ItemCard from '@/components/home/ItemCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { PackageOpen } from 'lucide-react';

const PAGE_SIZE = 40;

export default function ProductGrid({ items = [], loading = false }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef(null);

  // Reset pagination whenever items list changes (new search)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [items.length]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, items.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [items.length]);

  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);
  const hasMore = visibleCount < items.length;

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 8 }).map((_, index) => (
          <SkeletonCard key={index} className="h-64 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
          <PackageOpen className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-600 font-medium">No products found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {visibleItems.map((item) => (
          <ItemCard key={item._id || item.id} item={item} className="w-full min-w-0 max-w-none" />
        ))}
      </div>
      {hasMore && (
        <div ref={loaderRef} className="flex justify-center py-6">
          <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
            <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#0C831F] animate-spin" />
            Loading more results...
          </div>
        </div>
      )}
    </>
  );
}
