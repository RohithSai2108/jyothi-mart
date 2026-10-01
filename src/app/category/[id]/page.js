'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  ChevronRight,
  PackageOpen,
  Layers,
  Search,
  X,
  ArrowUpDown,
  Sparkles,
  ArrowRight,
  Check,
  RotateCcw,
} from 'lucide-react';
import { getCatalog, getCategories, getSubcategories, getCachedData, setCachedData } from '@/lib/api';
import ItemCard from '@/components/home/ItemCard';
import { SkeletonCard } from '@/components/common/Skeleton';
import { matchesGroceryQuery } from '@/lib/searchSynonyms';

export default function CategoryPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const rawId = params?.id ? decodeURIComponent(params.id) : '';

  // Synchronous cache lookup for instantaneous category rendering
  const [currentCategory, setCurrentCategory] = useState(() => {
    if (typeof window !== 'undefined' && rawId) {
      const cached = getCachedData('categories');
      const catList = cached?.data || cached || [];
      if (Array.isArray(catList)) {
        return (
          catList.find(
            (c) =>
              String(c._id) === rawId ||
              c.slug === rawId ||
              c.name?.toLowerCase() === rawId.toLowerCase()
          ) || null
        );
      }
    }
    return null;
  });

  const [subcategories, setSubcategories] = useState(() => {
    if (typeof window !== 'undefined' && rawId) {
      const cached = getCachedData('categories');
      const catList = cached?.data || cached || [];
      if (Array.isArray(catList)) {
        const matched = catList.find(
          (c) =>
            String(c._id) === rawId ||
            c.slug === rawId ||
            c.name?.toLowerCase() === rawId.toLowerCase()
        );
        if (matched?.subcategories?.length > 0) {
          return matched.subcategories;
        }
      }
    }
    return [];
  });

  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(
    searchParams.get('sub') || 'all'
  );

  // In-Category Search and Filter states
  const [searchQuery, setSearchQuery] = useState(
    () => searchParams.get('q') || ''
  );
  const [sortBy, setSortBy] = useState('relevance'); // 'relevance' | 'price_asc' | 'price_desc' | 'discount'
  const [inStockOnly, setInStockOnly] = useState(false);
  const [itemTypeFilter, setItemTypeFilter] = useState('all'); // 'all' | 'packed' | 'loose'

  // Cross-category recommendation state
  const [crossCategoryMatch, setCrossCategoryMatch] = useState(null);
  const [searchingCrossCategory, setSearchingCrossCategory] = useState(false);

  // Synchronous cache lookup for products
  const [allItems, setAllItems] = useState(() => {
    if (typeof window !== 'undefined' && rawId) {
      const cached = getCachedData(`cat_items_${rawId}`);
      if (Array.isArray(cached)) return cached;
    }
    return [];
  });

  const [loading, setLoading] = useState(() => !currentCategory);
  const [itemsLoading, setItemsLoading] = useState(() => allItems.length === 0);

  // Progressive pagination: render 40 items at a time
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const loaderRef = useRef(null);
  const lastRevalidateRef = useRef(0);

  // Sync searchQuery from URL param if user lands from cross-category link or search
  useEffect(() => {
    const q = searchParams.get('q');
    if (q !== null && q !== undefined) {
      setSearchQuery(q);
    }
    const sub = searchParams.get('sub');
    if (sub) {
      setSelectedSubcategoryId(sub);
    }
  }, [searchParams]);

  // 1. Load Category and Subcategories (with silent background revalidation)
  useEffect(() => {
    if (!rawId) return;

    async function loadCategoryInfo() {
      if (!currentCategory) {
        setLoading(true);
      }
      try {
        const catRes = await getCategories();
        const catList = catRes.data?.data || catRes.data || [];

        const matched = catList.find(
          (c) =>
            String(c._id) === rawId ||
            c.slug === rawId ||
            c.name?.toLowerCase() === rawId.toLowerCase()
        );

        if (matched) {
          setCurrentCategory(matched);
          const subs =
            Array.isArray(matched.subcategories) && matched.subcategories.length > 0
              ? matched.subcategories
              : [];

          if (subs.length > 0) {
            setSubcategories(subs);
          } else {
            const subRes = await getSubcategories(matched._id).catch(() => ({ data: [] }));
            setSubcategories(subRes.data?.data || subRes.data || []);
          }
        } else {
          setCurrentCategory({
            _id: rawId,
            name: rawId.replace(/[-_]/g, ' '),
          });
        }
      } catch (err) {
        console.error('Failed to load category info:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCategoryInfo();
  }, [rawId]);

  // 2. Fetch all Catalog Items for this Category: instantaneous cached render + background SWR revalidation
  useEffect(() => {
    const targetCatId = currentCategory?._id || rawId;
    if (!targetCatId) return;

    if (allItems.length === 0) {
      setItemsLoading(true);
    }

    const loadCategoryCatalog = (force = false) => {
      getCatalog(
        { category: targetCatId },
        force,
        (freshRes) => {
          const freshData = freshRes?.data || freshRes?.items || (Array.isArray(freshRes) ? freshRes : []);
          setAllItems(freshData);
          setCachedData(`cat_items_${targetCatId}`, freshData, 60000);
        }
      )
        .then((res) => {
          const data = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);
          setAllItems(data);
          setCachedData(`cat_items_${targetCatId}`, data, 60000);
        })
        .catch((err) => {
          console.error('Failed to fetch catalog items for category:', err);
        })
        .finally(() => {
          setItemsLoading(false);
        });
    };

    // Initial load
    loadCategoryCatalog(false);

    // Auto-revalidate at most once per 5 minutes when tab is refocused
    const REVALIDATE_THROTTLE_MS = 5 * 60 * 1000;
    const handleFocus = () => {
      const now = Date.now();
      if (now - lastRevalidateRef.current > REVALIDATE_THROTTLE_MS) {
        lastRevalidateRef.current = now;
        loadCategoryCatalog(true);
      }
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        if (now - lastRevalidateRef.current > REVALIDATE_THROTTLE_MS) {
          lastRevalidateRef.current = now;
          loadCategoryCatalog(true);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [currentCategory?._id, rawId]);

  // ── FILTERING & MULTILINGUAL SEARCH PIPELINE ──

  // 1. Matches in the whole category according to Telugu / Hindi / English synonym engine
  const inCategorySearchMatches = useMemo(() => {
    if (!searchQuery.trim()) {
      return allItems;
    }
    return allItems.filter((item) => matchesGroceryQuery(item, searchQuery));
  }, [allItems, searchQuery]);

  // 2. Matches filtered by subcategory
  const subcategoryMatches = useMemo(() => {
    if (!selectedSubcategoryId || selectedSubcategoryId === 'all') {
      return inCategorySearchMatches;
    }
    return inCategorySearchMatches.filter((item) => {
      return (
        String(item.subcategoryId) === String(selectedSubcategoryId) ||
        (item.subcategoryName &&
          item.subcategoryName.toLowerCase() === String(selectedSubcategoryId).toLowerCase())
      );
    });
  }, [inCategorySearchMatches, selectedSubcategoryId]);

  // 3. Final displayed items with Stock, Type & Sorting applied
  const displayedItems = useMemo(() => {
    let items = subcategoryMatches;

    // Filter: In Stock Only
    if (inStockOnly) {
      items = items.filter((item) => item.stock > 0);
    }

    // Filter: Item Type (Packed vs Loose)
    if (itemTypeFilter === 'packed') {
      items = items.filter((item) => item.itemType === 'packed' || item.packageOnly);
    } else if (itemTypeFilter === 'loose') {
      items = items.filter((item) => item.itemType === 'loose' || !item.packageOnly);
    }

    // Sort items
    const sorted = [...items];
    if (sortBy === 'price_asc') {
      sorted.sort((a, b) => (Number(a.retailPrice) || 0) - (Number(b.retailPrice) || 0));
    } else if (sortBy === 'price_desc') {
      sorted.sort((a, b) => (Number(b.retailPrice) || 0) - (Number(a.retailPrice) || 0));
    } else if (sortBy === 'discount') {
      sorted.sort((a, b) => {
        const discA = a.mrp && a.mrp > a.retailPrice ? (a.mrp - a.retailPrice) / a.mrp : 0;
        const discB = b.mrp && b.mrp > b.retailPrice ? (b.mrp - b.retailPrice) / b.mrp : 0;
        return discB - discA;
      });
    } else {
      // Relevance (default)
      const q = searchQuery.toLowerCase().trim();
      sorted.sort((a, b) => {
        // In-stock items prioritized over out-of-stock items
        const aOutOfStock = a.stock <= 0 ? 1 : 0;
        const bOutOfStock = b.stock <= 0 ? 1 : 0;
        if (aOutOfStock !== bOutOfStock) return aOutOfStock - bOutOfStock;

        // Exact / prefix name match ranking
        if (q) {
          const aName = (a.name || '').toLowerCase();
          const bName = (b.name || '').toLowerCase();
          const aStarts = aName.startsWith(q) ? 2 : aName.includes(q) ? 1 : 0;
          const bStarts = bName.startsWith(q) ? 2 : bName.includes(q) ? 1 : 0;
          if (aStarts !== bStarts) return bStarts - aStarts;
        }

        return (a.displayOrder || 0) - (b.displayOrder || 0);
      });
    }

    return sorted;
  }, [subcategoryMatches, inStockOnly, itemTypeFilter, sortBy, searchQuery]);

  // Reset visible count when displayed items change (filter / search change)
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [displayedItems.length, searchQuery, selectedSubcategoryId, sortBy, inStockOnly, itemTypeFilter]);

  // Intersection Observer: load next page when sentinel is visible
  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, displayedItems.length));
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [displayedItems.length]);

  // Visible slice of items for current page
  const visibleItems = useMemo(() => displayedItems.slice(0, visibleCount), [displayedItems, visibleCount]);
  const hasMoreItems = visibleCount < displayedItems.length;

  // ── CROSS-CATEGORY DETECTION ENGINE ──
  // If the customer searches for something with 0 results in this category,
  // we check if it exists in other categories and show a 1-tap switch suggestion.
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || q.length < 2 || inCategorySearchMatches.length > 0 || itemsLoading) {
      setCrossCategoryMatch(null);
      setSearchingCrossCategory(false);
      return;
    }

    setSearchingCrossCategory(true);
    const timer = setTimeout(async () => {
      try {
        const res = await getCatalog({ search: q });
        const list = res.data?.data || res.data?.items || (Array.isArray(res.data) ? res.data : []);

        const currentCatIdStr = String(currentCategory?._id || rawId).toLowerCase();
        const currentCatName = String(currentCategory?.name || '').toLowerCase();

        // Items that belong to ANY other category
        const outsideItems = list.filter((item) => {
          const itemCatId = String(item.categoryId || item.groupId || '').toLowerCase();
          const itemCatName = String(item.categoryName || item.group || '').toLowerCase();
          return itemCatId !== currentCatIdStr && itemCatName !== currentCatName;
        });

        if (outsideItems.length > 0) {
          // Group by category to find best match
          const counts = {};
          const catMap = {};
          for (const item of outsideItems) {
            const catKey = item.categoryId || item.categoryName || item.groupId || 'other';
            const catName = item.categoryName || item.group || 'Other Category';
            counts[catKey] = (counts[catKey] || 0) + 1;
            catMap[catKey] = {
              categoryId: item.categoryId || item.groupId || catKey,
              categoryName: catName,
            };
          }

          let bestCatKey = null;
          let maxCount = 0;
          for (const key of Object.keys(counts)) {
            if (counts[key] > maxCount) {
              maxCount = counts[key];
              bestCatKey = key;
            }
          }

          if (bestCatKey && catMap[bestCatKey]) {
            setCrossCategoryMatch({
              ...catMap[bestCatKey],
              count: maxCount,
              totalOutside: outsideItems.length,
            });
          } else {
            setCrossCategoryMatch(null);
          }
        } else {
          setCrossCategoryMatch(null);
        }
      } catch (err) {
        console.error('Error finding cross-category items:', err);
        setCrossCategoryMatch(null);
      } finally {
        setSearchingCrossCategory(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, inCategorySearchMatches.length, itemsLoading, currentCategory?._id, currentCategory?.name, rawId]);

  // Handle Search Submission / Enter Key
  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    // If 0 items in current category and a cross-category match was found, automatically redirect!
    if (inCategorySearchMatches.length === 0 && crossCategoryMatch) {
      const target = crossCategoryMatch.categoryId || crossCategoryMatch.categoryName;
      router.push(`/category/${encodeURIComponent(target)}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const activeSubcategory = useMemo(() => {
    if (selectedSubcategoryId === 'all') return null;
    return subcategories.find((s) => String(s._id) === String(selectedSubcategoryId));
  }, [selectedSubcategoryId, subcategories]);

  const categoryTitle = currentCategory?.name || 'Category';
  const currentSubTitle = activeSubcategory ? activeSubcategory.name : `All ${categoryTitle}`;

  // Check if any filters are active
  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    sortBy !== 'relevance' ||
    inStockOnly ||
    itemTypeFilter !== 'all' ||
    selectedSubcategoryId !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSortBy('relevance');
    setInStockOnly(false);
    setItemTypeFilter('all');
    setSelectedSubcategoryId('all');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col pb-24">
      {/* Top Header & Breadcrumbs (Zepto Style) */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Back button & Breadcrumb */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="p-1 -ml-1 text-gray-700 hover:bg-gray-100 rounded-full transition cursor-pointer flex-shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <Link href="/" className="hover:text-gray-900 transition flex-shrink-0 font-medium">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <Link href="/category" className="hover:text-gray-900 transition flex-shrink-0 font-medium">
              Grocery
            </Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <span className="font-bold text-gray-900 truncate">{categoryTitle}</span>
          </div>

          {/* Quick Count Badge */}
          {!itemsLoading && (
            <div className="text-xs font-semibold text-[#0C831F] hidden sm:block">
              {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'} available
            </div>
          )}
        </div>
      </header>

      {/* Main Zepto Layout */}
      <div className="max-w-7xl mx-auto w-full px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex-1 flex flex-col md:flex-row gap-3 sm:gap-6">
        {/* Left Subcategory Rail / Sidebar */}
        <aside className="w-full md:w-64 lg:w-72 flex-shrink-0 bg-white md:rounded-3xl border border-gray-200 shadow-2xs p-2 sm:p-3 overflow-hidden">
          <div className="hidden md:flex items-center gap-2 px-3 py-2 border-b border-gray-100 mb-2">
            <Layers className="w-4 h-4 text-[#0C831F]" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
              Subcategories
            </span>
          </div>

          {/* Scrollable list of subcategories */}
          <div className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-y-auto no-scrollbar md:max-h-[75vh] py-1">
            {/* "All" Option */}
            <button
              onClick={() => setSelectedSubcategoryId('all')}
              className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-2xl text-left transition cursor-pointer flex-shrink-0 md:flex-shrink md:w-full border ${
                selectedSubcategoryId === 'all'
                  ? 'bg-purple-50/80 text-purple-900 border-purple-300 font-extrabold shadow-2xs'
                  : 'bg-white text-gray-700 border-transparent hover:bg-gray-50'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center flex-shrink-0 text-xs font-bold">
                All
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm block truncate">All {categoryTitle}</span>
              </div>
            </button>

            {/* Subcategories list */}
            {subcategories.map((sub) => {
              const isActive = String(selectedSubcategoryId) === String(sub._id);
              return (
                <button
                  key={sub._id}
                  onClick={() => setSelectedSubcategoryId(sub._id)}
                  className={`flex items-center space-x-2.5 px-3 py-2.5 rounded-2xl text-left transition cursor-pointer flex-shrink-0 md:flex-shrink md:w-full border ${
                    isActive
                      ? 'bg-purple-50 text-purple-950 border-purple-400 font-extrabold shadow-2xs'
                      : 'bg-white text-gray-700 border-transparent hover:bg-gray-50'
                  }`}
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {sub.image ? (
                      <img
                        src={sub.image}
                        alt={sub.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-xs font-bold text-gray-400">
                        {sub.name?.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <span className="text-xs sm:text-sm block truncate leading-tight">
                      {sub.name}
                    </span>
                    {sub.itemCount !== undefined && (
                      <span className="text-[10px] text-gray-400 font-normal">
                        {sub.itemCount} items
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Main Content: Search, Filters & Product Grid */}
        <main className="flex-1 min-w-0 flex flex-col space-y-4">
          {/* In-Category Search Bar + Category Title */}
          <div className="bg-white rounded-3xl border border-gray-200 p-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">
                  {currentSubTitle}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  {displayedItems.length} {displayedItems.length === 1 ? 'item' : 'items'} found in {categoryTitle}
                </p>
              </div>

              {currentCategory?.image && (
                <div className="w-10 h-10 rounded-xl bg-gray-50 p-1 border border-gray-100 hidden sm:block self-start sm:self-auto">
                  <img
                    src={currentCategory.image}
                    alt={categoryTitle}
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* In-Category Real-Time Search Bar */}
            <form onSubmit={handleSearchSubmit} className="relative">
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Search in ${categoryTitle} (e.g. toor dal, kandipappu, oil)...`}
                  className="w-full bg-gray-50 hover:bg-gray-100/70 focus:bg-white pl-10 pr-24 py-2.5 rounded-2xl text-xs sm:text-sm font-medium text-gray-900 placeholder-gray-400 border border-gray-200 focus:border-[#0C831F] focus:outline-none focus:ring-2 focus:ring-[#0C831F]/20 transition"
                />
                <div className="absolute right-2.5 flex items-center gap-1">
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-1 text-gray-400 hover:text-gray-700 rounded-full transition cursor-pointer"
                      aria-label="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-2.5 py-1 bg-[#0C831F] text-white text-[11px] font-bold rounded-xl hover:bg-green-700 transition cursor-pointer shadow-2xs"
                  >
                    Search
                  </button>
                </div>
              </div>
            </form>

            {/* Filter and Sort Toolbar */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 overflow-x-auto no-scrollbar py-0.5 text-xs">
              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-2.5 py-1.5 rounded-xl border border-gray-200 flex-shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-transparent text-gray-700 font-semibold focus:outline-none cursor-pointer text-xs"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="discount">Discount (% OFF)</option>
                </select>
              </div>

              {/* In-Stock Toggle Pill */}
              <button
                onClick={() => setInStockOnly(!inStockOnly)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition cursor-pointer flex-shrink-0 border ${
                  inStockOnly
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {inStockOnly && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                <span>In Stock Only</span>
              </button>

              {/* Item Type (Packed vs Loose) Pill Selector */}
              <div className="flex items-center bg-gray-100 p-0.5 rounded-xl flex-shrink-0 border border-gray-200">
                <button
                  onClick={() => setItemTypeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    itemTypeFilter === 'all'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setItemTypeFilter('packed')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    itemTypeFilter === 'packed'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Packaged
                </button>
                <button
                  onClick={() => setItemTypeFilter('loose')}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer ${
                    itemTypeFilter === 'loose'
                      ? 'bg-white text-gray-900 shadow-2xs'
                      : 'text-gray-500 hover:text-gray-900'
                  }`}
                >
                  Loose (Kg/Gm)
                </button>
              </div>

              {/* Reset Filters Button */}
              {hasActiveFilters && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-red-600 hover:bg-red-50 rounded-xl transition cursor-pointer font-bold text-xs flex-shrink-0 ml-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>

          {/* Subcategory Hint: item found in another subcategory of current category */}
          {selectedSubcategoryId !== 'all' &&
            subcategoryMatches.length === 0 &&
            inCategorySearchMatches.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                <div className="text-xs text-purple-900">
                  <span className="font-bold">Not in &quot;{currentSubTitle}&quot;</span>, but found{' '}
                  <span className="font-extrabold text-purple-700">
                    {inCategorySearchMatches.length} {inCategorySearchMatches.length === 1 ? 'item' : 'items'}
                  </span>{' '}
                  in other subcategories of {categoryTitle}.
                </div>
                <button
                  onClick={() => setSelectedSubcategoryId('all')}
                  className="bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-purple-800 transition cursor-pointer flex-shrink-0 self-start sm:self-auto"
                >
                  View All in {categoryTitle}
                </button>
              </div>
            )}

          {/* Cross-Category Suggestion Banner */}
          {crossCategoryMatch && inCategorySearchMatches.length === 0 && (
            <div className="bg-amber-50/90 border border-amber-300 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-amber-800">
                    Looking for &quot;{searchQuery}&quot; outside {categoryTitle}?
                  </div>
                  <div className="text-sm font-black text-gray-900">
                    Found {crossCategoryMatch.count} {crossCategoryMatch.count === 1 ? 'item' : 'items'} in{' '}
                    <span className="text-[#0C831F] underline">{crossCategoryMatch.categoryName}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    const target = crossCategoryMatch.categoryId || crossCategoryMatch.categoryName;
                    router.push(`/category/${encodeURIComponent(target)}?q=${encodeURIComponent(searchQuery.trim())}`);
                  }}
                  className="bg-[#0C831F] text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold hover:bg-green-700 transition flex items-center gap-1.5 cursor-pointer shadow-xs whitespace-nowrap"
                >
                  <span>Switch to {crossCategoryMatch.categoryName}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Product Grid Area */}
          {itemsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {Array.from({ length: 8 }).map((_, idx) => (
                <SkeletonCard key={idx} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center shadow-2xs">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-400">
                <PackageOpen className="w-10 h-10" />
              </div>

              {searchQuery.trim() ? (
                <>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">
                    No products matching &quot;{searchQuery}&quot; in {categoryTitle}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-5">
                    {crossCategoryMatch ? (
                      <>
                        This product is available in{' '}
                        <strong className="text-gray-800">{crossCategoryMatch.categoryName}</strong>. Click above to view it.
                      </>
                    ) : (
                      'Try checking spelling, searching Telugu / Hindi names, or clearing your filters.'
                    )}
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <button
                      onClick={() => setSearchQuery('')}
                      className="bg-gray-100 text-gray-800 text-xs sm:text-sm font-bold px-4 py-2 rounded-xl hover:bg-gray-200 transition cursor-pointer"
                    >
                      Clear Search
                    </button>
                    <Link
                      href={`/search?q=${encodeURIComponent(searchQuery)}`}
                      className="bg-[#0C831F] text-white text-xs sm:text-sm font-bold px-4 py-2 rounded-xl hover:bg-green-700 transition cursor-pointer flex items-center gap-1.5"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search All Jyothi Mart</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">
                    No items in this subcategory yet
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 max-w-sm mb-5">
                    Products added or categorized under &quot;{currentSubTitle}&quot; will appear right here.
                  </p>
                  {selectedSubcategoryId !== 'all' && (
                    <button
                      onClick={() => setSelectedSubcategoryId('all')}
                      className="bg-[#0C831F] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-green-700 transition cursor-pointer"
                    >
                      View All {categoryTitle} Items
                    </button>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {visibleItems.map((item) => (
                  <ItemCard
                    key={item._id || item.id}
                    item={item}
                    className="w-full min-w-0 max-w-none"
                  />
                ))}
              </div>
              {/* Sentinel for infinite scroll */}
              {hasMoreItems && (
                <div ref={loaderRef} className="flex justify-center py-6">
                  <div className="flex items-center gap-2 text-xs text-gray-400 font-semibold">
                    <span className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-[#0C831F] animate-spin" />
                    Loading {Math.min(PAGE_SIZE, displayedItems.length - visibleCount)} more...
                  </div>
                </div>
              )}
              {!hasMoreItems && displayedItems.length > PAGE_SIZE && (
                <div className="text-center py-4 text-xs text-gray-400 font-medium">
                  Showing all {displayedItems.length} items
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
