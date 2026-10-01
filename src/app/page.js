'use client';
import { useEffect, useState } from 'react';
import HeroBannerCarousel, { DEFAULT_HERO_BANNERS } from '@/components/home/HeroBannerCarousel';
import ShopByCategory from '@/components/home/ShopByCategory';
import { getCategories, getStoreInfo, getCachedData } from '@/lib/api';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [heroBanners, setHeroBanners] = useState(DEFAULT_HERO_BANNERS);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Background network revalidation with 5s timeout
  const loadData = async (forceRefresh = false) => {
    if (forceRefresh) setLoading(true);
    setLoadError(null);
    try {
      const [catRes, infoRes] = await Promise.all([
        getCategories(forceRefresh, null, 5000).catch((err) => {
          console.warn('Categories load error/timeout:', err);
          return { data: [] };
        }),
        getStoreInfo(forceRefresh, null).catch(() => ({ data: {} })),
      ]);

      const rawCats = catRes.data?.data || catRes.data || [];
      if (Array.isArray(rawCats) && rawCats.length > 0) {
        setCategories(rawCats);
      } else if (categories.length === 0) {
        setLoadError('Categories took too long to load');
      }

      // Load dynamic hero banners configured in Store Settings
      const storeData = infoRes.data?.data || infoRes.data || {};
      const banners = storeData.heroBanners;
      if (Array.isArray(banners) && banners.length > 0) {
        setHeroBanners(banners);
      }
    } catch (err) {
      console.error('Failed to load homepage data:', err);
      if (categories.length === 0) {
        setLoadError(err.message || 'Failed to connect');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Immediately hydrate from fast cache on client mount (instant 0ms render)
    const cachedCats = getCachedData('categories');
    const catList = cachedCats?.data || cachedCats || [];
    if (Array.isArray(catList) && catList.length > 0) {
      setCategories(catList);
      setLoading(false);
    }

    const cachedStore = getCachedData('store_info');
    const info = cachedStore?.data || cachedStore || {};
    if (Array.isArray(info.heroBanners) && info.heroBanners.length > 0) {
      setHeroBanners(info.heroBanners);
    }

    // 2. Fetch fresh data with 5000ms max timeout
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Dynamic Cover Carousel (Zepto, Amazon, Prime Video, Netflix style) */}
      <HeroBannerCarousel banners={heroBanners} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-2 sm:mt-4">
        {/* Zepto Style Shop by Category with Dynamic Lazy Loading */}
        <ShopByCategory
          categories={categories}
          loading={loading}
          error={loadError}
          onRetry={() => loadData(true)}
        />
      </div>
    </div>
  );
}
