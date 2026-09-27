'use client';
import { useEffect, useState } from 'react';
import HeroBannerCarousel, { DEFAULT_HERO_BANNERS } from '@/components/home/HeroBannerCarousel';
import ShopByCategory from '@/components/home/ShopByCategory';
import { getCategories, getStoreInfo, getCachedData } from '@/lib/api';

export default function Home() {
  const [categories, setCategories] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedData('categories');
      const list = cached?.data || cached || [];
      if (Array.isArray(list) && list.length > 0) return list;
    }
    return [];
  });

  const [heroBanners, setHeroBanners] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedData('store_info');
      const info = cached?.data || cached || {};
      if (Array.isArray(info.heroBanners) && info.heroBanners.length > 0) {
        return info.heroBanners;
      }
    }
    return DEFAULT_HERO_BANNERS;
  });

  const [loading, setLoading] = useState(() => {
    if (typeof window !== 'undefined') {
      const cached = getCachedData('categories');
      const list = cached?.data || cached || [];
      if (Array.isArray(list) && list.length > 0) return false;
    }
    return true;
  });

  useEffect(() => {
    async function loadData() {
      // If we don't have categories yet, show skeleton, else revalidate silently in background
      if (categories.length === 0) {
        setLoading(true);
      }
      try {
        const [catRes, infoRes] = await Promise.all([
          getCategories().catch(() => ({ data: [] })),
          getStoreInfo().catch(() => ({ data: {} })),
        ]);

        const rawCats = catRes.data?.data || catRes.data || [];
        if (Array.isArray(rawCats) && rawCats.length > 0) {
          setCategories(rawCats);
        }

        // Load dynamic hero banners configured in Store Settings
        const storeData = infoRes.data?.data || infoRes.data || {};
        const banners = storeData.heroBanners;
        if (Array.isArray(banners) && banners.length > 0) {
          setHeroBanners(banners);
        }
      } catch (err) {
        console.error('Failed to load homepage data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Dynamic Cover Carousel (Zepto, Amazon, Prime Video, Netflix style) */}
      <HeroBannerCarousel banners={heroBanners} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        {/* Zepto Style Shop by Category */}
        <ShopByCategory categories={categories} loading={loading} />
      </div>
    </div>
  );
}
