import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://shop-price-manager.vercel.app/api/store',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─────────────────────────────────────────────
// CLIENT-SIDE SWR CACHING & REQUEST DEDUPLICATION
// ─────────────────────────────────────────────
const memoryCache = new Map();
const inFlightRequests = new Map();

export const getCachedData = (key) => {
  if (typeof window === 'undefined') return null;
  // 1. Check in-memory cache
  if (memoryCache.has(key)) {
    const entry = memoryCache.get(key);
    if (Date.now() - entry.time < entry.ttl) {
      return entry.data;
    }
  }
  // 2. Check sessionStorage
  try {
    const item = sessionStorage.getItem(`jm_cache_${key}`);
    if (item) {
      const parsed = JSON.parse(item);
      if (Date.now() - parsed.time < parsed.ttl) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch (e) {}
  return null;
};

export const setCachedData = (key, data, ttlMs = 180000) => {
  const entry = { data, time: Date.now(), ttl: ttlMs };
  memoryCache.set(key, entry);
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`jm_cache_${key}`, JSON.stringify(entry));
    } catch (e) {}
  }
};

export const clearStoreCache = () => {
  memoryCache.clear();
  inFlightRequests.clear();
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach((k) => {
        if (k.startsWith('jm_cache_')) sessionStorage.removeItem(k);
      });
    } catch (e) {}
  }
};

const fetchWithCache = async (cacheKey, fetchFn, ttlMs = 180000, forceRefresh = false) => {
  if (!forceRefresh) {
    const cached = getCachedData(cacheKey);
    if (cached) {
      return { data: cached, fromCache: true };
    }
  }

  // Request deduplication: if identical request is currently in-flight, return same promise
  if (inFlightRequests.has(cacheKey)) {
    return inFlightRequests.get(cacheKey);
  }

  const promise = (async () => {
    try {
      const res = await fetchFn();
      setCachedData(cacheKey, res.data, ttlMs);
      return res;
    } finally {
      inFlightRequests.delete(cacheKey);
    }
  })();

  inFlightRequests.set(cacheKey, promise);
  return promise;
};

// Public Auth Endpoints
export const sendOtp = (phone) => api.post('/auth/send-otp', { phone });
export const verifyOtp = (phone, otp, firebaseToken, firebaseUid) =>
  api.post('/auth/verify-otp', { phone, otp, firebaseToken, firebaseUid });

// Store Public Data with Fast SWR Caching
export const getStoreInfo = (forceRefresh = false) =>
  fetchWithCache('store_info', () => api.get('/info'), 180000, forceRefresh);

export const getCategories = (forceRefresh = false) =>
  fetchWithCache(
    'categories',
    () => api.get('/categories').catch(() => api.get('/catalog/categories')),
    180000,
    forceRefresh
  );

export const getSubcategories = (categoryId, forceRefresh = false) =>
  fetchWithCache(
    `subcategories_${categoryId || 'all'}`,
    () => api.get('/subcategories', { params: categoryId ? { category: categoryId } : {} }),
    180000,
    forceRefresh
  );

export const getCatalog = (params = {}, forceRefresh = false) => {
  const cacheKey = `catalog_${JSON.stringify(params || {})}`;
  return fetchWithCache(
    cacheKey,
    () => api.get('/catalog', { params }),
    60000, // 60s catalog cache
    forceRefresh
  );
};

export const validateCart = (items) => api.post('/cart/validate', { items });
export const placeOrder = (orderData) => api.post('/orders', orderData);
export const getMyOrders = () => api.get('/orders/my').catch(() => api.get('/orders/me'));
export const getOrderById = (id) => api.get(`/orders/${id}`);

// Admin API with automatic cache invalidation
export const getAdminItems = () => api.get('/admin/items');
export const updateAdminItem = async (id, data) => {
  const res = await api.put(`/admin/items/${id}`, data);
  clearStoreCache();
  return res;
};

export const getAdminOrders = (params) => api.get('/admin/orders', { params });
export const updateAdminOrder = (id, data) => api.put(`/admin/orders/${id}`, data);
export const getDeliveryPersonnel = () => api.get('/admin/delivery-personnel');
export const getAdminSettings = () => api.get('/admin/settings');
export const updateAdminSettings = async (data) => {
  const res = await api.put('/admin/settings', data);
  clearStoreCache();
  return res;
};

export const getAdminUsers = () => api.get('/admin/users');
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);

// Admin Category & Subcategory API with automatic cache invalidation
export const getAdminCategories = () => api.get('/admin/categories');
export const createAdminCategory = async (data) => {
  const res = await api.post('/admin/categories', data);
  clearStoreCache();
  return res;
};
export const updateAdminCategory = async (id, data) => {
  const res = await api.put(`/admin/categories/${id}`, data);
  clearStoreCache();
  return res;
};
export const deleteAdminCategory = async (id) => {
  const res = await api.delete(`/admin/categories/${id}`);
  clearStoreCache();
  return res;
};

export const getAdminSubcategories = (categoryId) =>
  api.get('/admin/subcategories', { params: categoryId ? { category: categoryId } : {} });
export const createAdminSubcategory = async (data) => {
  const res = await api.post('/admin/subcategories', data);
  clearStoreCache();
  return res;
};
export const updateAdminSubcategory = async (id, data) => {
  const res = await api.put(`/admin/subcategories/${id}`, data);
  clearStoreCache();
  return res;
};
export const deleteAdminSubcategory = async (id) => {
  const res = await api.delete(`/admin/subcategories/${id}`);
  clearStoreCache();
  return res;
};

// Delivery API
export const getDeliveryOrders = (params) => api.get('/delivery/orders', { params });
export const updateDeliveryOrderStatus = (id, status, note) =>
  api.put(`/delivery/orders/${id}/status`, { status, note });

export default api;
