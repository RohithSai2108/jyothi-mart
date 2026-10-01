'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Truck,
  Navigation,
  CheckCircle,
  Phone,
  MapPin,
  Package,
  RefreshCw,
  Clock,
  ArrowLeft,
  Check,
  Search,
  Map,
  Filter,
  TrendingUp,
  AlertCircle,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryOrders, updateDeliveryOrderStatus, getStoreInfo } from '@/lib/api';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';
import DeliveryStatsCard from '@/components/delivery/DeliveryStatsCard';
import DeliveryOrderCard from '@/components/delivery/DeliveryOrderCard';
import DeliveryOtpModal from '@/components/delivery/DeliveryOtpModal';

import DeliveryRouteMap from '@/components/delivery/DeliveryRouteMap';

export default function DeliveryDashboardPage() {
  const { user, isDelivery, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();

  // Navigation & Filtering State
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'map' | 'completed' | 'earnings'
  const [activeFilter, setActiveFilter] = useState('all'); // 'all' | 'ready' | 'out'
  const [completedFilter, setCompletedFilter] = useState('today'); // 'today' | 'week' | 'all'
  const [searchQuery, setSearchQuery] = useState('');

  // Orders & Store Info State
  const [orders, setOrders] = useState([]);
  const [storeCenter, setStoreCenter] = useState({ lat: 18.8256, lng: 78.9135 });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Duty & Auto-Refresh State
  const [isOnDuty, setIsOnDuty] = useState(true);
  const [refreshCountdown, setRefreshCountdown] = useState(30);

  // OTP Modal State
  const [selectedOrderForOtp, setSelectedOrderForOtp] = useState(null);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);

  const prevOrderCountRef = useRef(0);

  // Load duty status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jm_delivery_onduty');
      if (saved !== null) {
        setIsOnDuty(saved === 'true');
      }
    }
  }, []);

  const toggleDuty = () => {
    const next = !isOnDuty;
    setIsOnDuty(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jm_delivery_onduty', String(next));
    }
    showToast(next ? 'You are now ON DUTY (Online)' : 'You are now OFF DUTY (Offline)');
  };

  // Protect Delivery route
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/delivery');
      } else if (!isDelivery && !isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isDelivery, isAdmin, authLoading, router]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Fetch Delivery Orders
  const fetchOrders = useCallback(
    async (isManual = false) => {
      if (isManual) setLoading(true);
      try {
        const res = await getDeliveryOrders({ all: 'true' });
        const list = res.data?.data || res.data || [];
        const orderList = Array.isArray(list) ? list : [];

        // Check if new orders arrived to notify the driver
        const activeCount = orderList.filter(
          (o) => o.status !== 'delivered' && o.status !== 'cancelled'
        ).length;

        if (
          prevOrderCountRef.current > 0 &&
          activeCount > prevOrderCountRef.current &&
          isOnDuty
        ) {
          showToast('🔔 New delivery order assigned to you!');
        }
        prevOrderCountRef.current = activeCount;

        setOrders(orderList);
      } catch (err) {
        console.error('Failed to load delivery orders:', err);
      } finally {
        setLoading(false);
      }
    },
    [isOnDuty]
  );

  // Initial Data Fetch & Warehouse Location
  useEffect(() => {
    if (isDelivery || isAdmin) {
      fetchOrders(true);

      // Get store coordinates for map routing
      getStoreInfo()
        .then((res) => {
          const info = res.data?.data || res.data || {};
          if (info.location?.coordinates?.length >= 2) {
            setStoreCenter({
              lat: info.location.coordinates[1],
              lng: info.location.coordinates[0],
            });
          }
        })
        .catch(() => {});
    }
  }, [isDelivery, isAdmin, fetchOrders]);

  // 30-Second Real-Time Auto-Refresh Interval
  useEffect(() => {
    if (!isOnDuty || (!isDelivery && !isAdmin)) return;

    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchOrders(false);
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnDuty, isDelivery, isAdmin, fetchOrders]);

  // Quick Status Update (Pick Up)
  const handleUpdateStatus = async (orderId, newStatus, note = '') => {
    setUpdatingId(orderId);
    try {
      const res = await updateDeliveryOrderStatus(orderId, newStatus, note);
      const updated = res.data?.data || res.data;

      setOrders((prev) =>
        prev.map((o) =>
          (o._id === orderId || o.id === orderId) ? { ...o, ...updated, status: newStatus } : o
        )
      );

      const statusLabels = {
        out_for_delivery: 'Order picked up! Now Out for Delivery.',
        delivered: 'Order verified & marked as Delivered!',
      };
      showToast(statusLabels[newStatus] || 'Order updated successfully');
    } catch (err) {
      console.error('Failed to update delivery status:', err);
      showToast('Error updating status. Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Confirm Delivery via OTP Modal
  const handleConfirmDeliveryWithOtp = async (orderId, otp, note) => {
    setIsOtpSubmitting(true);
    try {
      await handleUpdateStatus(orderId, 'delivered', note);
      setSelectedOrderForOtp(null);
    } finally {
      setIsOtpSubmitting(false);
    }
  };

  // Partition Orders
  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const completedOrders = orders.filter((o) => o.status === 'delivered');

  // Filter Active Orders
  const filteredActiveOrders = activeOrders.filter((order) => {
    // Status Filter
    if (activeFilter === 'ready') {
      if (order.status !== 'confirmed' && order.status !== 'packing') return false;
    }
    if (activeFilter === 'out') {
      if (order.status !== 'out_for_delivery') return false;
    }

    // Search Query (by order number, phone, customer name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const orderNum = (order.orderNumber || order._id || order.id || '').toLowerCase();
      const name = (order.customerName || order.customer?.name || '').toLowerCase();
      const phone = (order.customerPhone || order.customer?.phone || '').toLowerCase();
      return orderNum.includes(q) || name.includes(q) || phone.includes(q);
    }

    return true;
  });

  // Filter Completed Orders by Time
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  const filteredCompletedOrders = completedOrders.filter((o) => {
    const orderTime = new Date(o.updatedAt || o.createdAt || 0).getTime();
    if (completedFilter === 'today') return orderTime >= startOfToday;
    if (completedFilter === 'week') return orderTime >= startOfWeek;
    return true;
  });

  // Earnings calculation
  const totalCompletedEarnings = filteredCompletedOrders.reduce((sum, o) => {
    const fee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 40;
    return sum + fee;
  }, 0);

  if (authLoading || ((!isDelivery && !isAdmin) && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0C831F]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-xs font-bold px-4 py-2.5 rounded-full shadow-2xl transition flex items-center space-x-2 animate-in fade-in slide-in-from-top-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Delivery Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          <div className="flex items-center space-x-3">
            <Link
              href="/"
              className="p-1.5 -ml-1.5 rounded-xl hover:bg-gray-100 transition text-gray-700 cursor-pointer"
              title="Return to Store"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-[#0C831F]" />
                <h1 className="text-base font-black text-gray-900 leading-tight">
                  Jyothi Mart Delivery
                </h1>
              </div>
              <p className="text-[11px] text-gray-500">
                Partner Portal • {user?.name || user?.phone || 'Driver'}
              </p>
            </div>
          </div>

          {/* Top Right: Status Badge & Admin Indicator */}
          <div className="flex items-center gap-2">
            {isAdmin && (
              <span className="text-[10px] font-extrabold bg-green-50 text-[#0C831F] border border-green-200 px-2 py-0.5 rounded-full">
                Admin Mode
              </span>
            )}
            <span
              className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                isOnDuty
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              {isOnDuty ? '● ONLINE' : '○ OFFLINE'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="p-4 max-w-3xl mx-auto space-y-4">
        {/* Driver Performance & Earnings Card */}
        <DeliveryStatsCard
          isOnDuty={isOnDuty}
          onToggleDuty={toggleDuty}
          orders={orders}
          timeFilter={completedFilter}
          onTimeFilterChange={setCompletedFilter}
          refreshCountdown={refreshCountdown}
          onManualRefresh={() => {
            setRefreshCountdown(30);
            fetchOrders(true);
          }}
          loading={loading}
        />

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1 border border-gray-200 shadow-2xs flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'active'
                ? 'bg-[#0C831F] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Active Orders</span>
            {activeOrders.length > 0 && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                  activeTab === 'active' ? 'bg-white text-[#0C831F]' : 'bg-green-100 text-[#0C831F]'
                }`}
              >
                {activeOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'map'
                ? 'bg-[#0C831F] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          <button
            onClick={() => setActiveTab('completed')}
            className={`flex-1 py-2.5 text-center text-xs font-extrabold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'completed'
                ? 'bg-[#0C831F] text-white shadow-2xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Delivered ({completedOrders.length})</span>
          </button>
        </div>

        {/* TAB 1: ACTIVE ORDERS LIST */}
        {activeTab === 'active' && (
          <div className="space-y-3.5">
            {/* Search & Sub-Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search order #, customer, or phone..."
                  className="w-full text-xs pl-9 pr-4 py-2.5 bg-white rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C831F]"
                />
              </div>

              {/* Status Sub-Filters */}
              <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
                {[
                  { id: 'all', label: 'All' },
                  { id: 'ready', label: 'Pick Up' },
                  { id: 'out', label: 'On Road' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setActiveFilter(f.id)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      activeFilter === f.id
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Active Orders */}
            {loading && orders.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-3xl p-5 border border-gray-200 space-y-3 animate-pulse"
                  >
                    <div className="flex justify-between">
                      <div className="h-5 w-32 bg-gray-200 rounded" />
                      <div className="h-5 w-20 bg-gray-200 rounded-full" />
                    </div>
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                  </div>
                ))}
              </div>
            ) : filteredActiveOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-white rounded-3xl border border-gray-200">
                <Truck className="w-12 h-12 text-gray-300 mb-3" />
                <h3 className="text-base font-bold text-gray-800">
                  {searchQuery ? 'No matching orders found' : 'No pending deliveries'}
                </h3>
                <p className="text-xs text-gray-500 mt-1 max-w-xs">
                  {searchQuery
                    ? 'Try searching with a different phone or order number.'
                    : isOnDuty
                    ? 'New orders will automatically appear here when dispatched from store.'
                    : 'You are currently OFF DUTY. Switch online above to receive orders.'}
                </p>
              </div>
            ) : (
              filteredActiveOrders.map((order) => (
                <DeliveryOrderCard
                  key={order._id || order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenOtpModal={(ord) => setSelectedOrderForOtp(ord)}
                  isUpdating={updatingId === (order._id || order.id)}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 2: INTERACTIVE ROUTE MAP VIEW (LAZY LOADED) */}
        {activeTab === 'map' && (
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-2xl border border-gray-200 text-xs text-gray-600 flex items-center justify-between">
              <span className="font-bold text-gray-800">
                Showing {activeOrders.length} active drop locations
              </span>
              <span className="text-[11px] text-gray-500">Tap pin to navigate</span>
            </div>

            {/* Lazy-Loaded Route Map */}
            <DeliveryRouteMap
              orders={activeOrders}
              storeCenter={storeCenter}
              onUpdateStatus={handleUpdateStatus}
            />
          </div>
        )}

        {/* TAB 3: COMPLETED DELIVERIES HISTORY */}
        {activeTab === 'completed' && (
          <div className="space-y-3.5">
            <div className="bg-white p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-gray-800 capitalize">
                  {completedFilter} Deliveries: {filteredCompletedOrders.length}
                </span>
                <p className="text-[11px] text-gray-500">
                  Total Earned: <strong>{formatPrice(totalCompletedEarnings)}</strong>
                </p>
              </div>

              {/* Time Filter Pills */}
              <div className="flex gap-1">
                {['today', 'week', 'all'].map((period) => (
                  <button
                    key={period}
                    onClick={() => setCompletedFilter(period)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                      completedFilter === period
                        ? 'bg-[#0C831F] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {period === 'today' ? 'Today' : period === 'week' ? 'Week' : 'All'}
                  </button>
                ))}
              </div>
            </div>

            {filteredCompletedOrders.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 p-6">
                <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-gray-700">No completed orders for this period</p>
                <p className="text-xs text-gray-500 mt-1">
                  Deliveries you complete will appear in this history list.
                </p>
              </div>
            ) : (
              filteredCompletedOrders.map((order) => (
                <DeliveryOrderCard
                  key={order._id || order.id}
                  order={order}
                  onUpdateStatus={handleUpdateStatus}
                  onOpenOtpModal={(ord) => setSelectedOrderForOtp(ord)}
                  isUpdating={false}
                />
              ))
            )}
          </div>
        )}
      </main>

      {/* OTP Delivery Verification Modal */}
      {selectedOrderForOtp && (
        <DeliveryOtpModal
          isOpen={Boolean(selectedOrderForOtp)}
          onClose={() => setSelectedOrderForOtp(null)}
          order={selectedOrderForOtp}
          onConfirmDelivery={handleConfirmDeliveryWithOtp}
          isSubmitting={isOtpSubmitting}
        />
      )}
    </div>
  );
}
