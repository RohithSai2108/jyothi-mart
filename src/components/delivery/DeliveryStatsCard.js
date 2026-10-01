'use client';
import {
  Truck,
  IndianRupee,
  CheckCircle,
  Clock,
  RefreshCw,
  Power,
  TrendingUp,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function DeliveryStatsCard({
  isOnDuty = true,
  onToggleDuty,
  orders = [],
  timeFilter = 'today',
  onTimeFilterChange,
  refreshCountdown = 30,
  onManualRefresh,
  loading = false,
}) {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;

  // Filter completed orders based on timeFilter
  const completedOrders = orders.filter((o) => {
    if (o.status !== 'delivered') return false;
    const orderTime = new Date(o.updatedAt || o.createdAt || 0).getTime();
    if (timeFilter === 'today') return orderTime >= startOfToday;
    if (timeFilter === 'week') return orderTime >= startOfWeek;
    return true;
  });

  const activeOrders = orders.filter(
    (o) => o.status !== 'delivered' && o.status !== 'cancelled'
  );

  const outForDeliveryOrders = orders.filter((o) => o.status === 'out_for_delivery');

  // Calculate earnings: Either order delivery fee or default ₹40 payout per order
  const totalEarnings = completedOrders.reduce((sum, o) => {
    const fee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 40;
    return sum + fee;
  }, 0);

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-4">
      {/* Top Row: Duty Toggle & Auto-refresh status */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-gray-100">
        {/* On Duty / Off Duty Button */}
        <button
          onClick={onToggleDuty}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black transition cursor-pointer active:scale-95 shadow-2xs ${
            isOnDuty
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          <span>{isOnDuty ? 'ON DUTY (Online)' : 'OFF DUTY (Offline)'}</span>
        </button>

        {/* Live Auto-Refresh Status Indicator */}
        <div className="flex items-center gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnDuty ? 'bg-[#0C831F] animate-pulse' : 'bg-gray-400'
              }`}
            />
            <span className="text-[11px] font-medium">
              {isOnDuty ? `Auto-refresh in ${refreshCountdown}s` : 'Polling paused'}
            </span>
          </div>

          <button
            onClick={onManualRefresh}
            disabled={loading}
            className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-600 hover:text-[#0C831F] transition cursor-pointer disabled:opacity-50"
            title="Refresh Orders Now"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#0C831F]' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {/* Metric 1: Completed Deliveries */}
        <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 mb-1">
            <span className="text-[11px] font-bold">Delivered</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-emerald-900 leading-none">
              {completedOrders.length}
            </p>
            <p className="text-[10px] text-emerald-700 mt-1 capitalize">{timeFilter} deliveries</p>
          </div>
        </div>

        {/* Metric 2: Estimated Earnings */}
        <div className="bg-amber-50/60 rounded-2xl p-3 border border-amber-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-800 mb-1">
            <span className="text-[11px] font-bold">Est. Earnings</span>
            <IndianRupee className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-amber-900 leading-none">
              {formatPrice(totalEarnings)}
            </p>
            <p className="text-[10px] text-amber-700 mt-1">₹40/drop payout</p>
          </div>
        </div>

        {/* Metric 3: Active Orders */}
        <div className="bg-blue-50/60 rounded-2xl p-3 border border-blue-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-800 mb-1">
            <span className="text-[11px] font-bold">Active Queue</span>
            <Clock className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-blue-900 leading-none">
              {activeOrders.length}
            </p>
            <p className="text-[10px] text-blue-700 mt-1">Ready for action</p>
          </div>
        </div>

        {/* Metric 4: On the Road */}
        <div className="bg-purple-50/60 rounded-2xl p-3 border border-purple-100 flex flex-col justify-between">
          <div className="flex items-center justify-between text-purple-800 mb-1">
            <span className="text-[11px] font-bold">On the Road</span>
            <Truck className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <p className="text-xl sm:text-2xl font-black text-purple-900 leading-none">
              {outForDeliveryOrders.length}
            </p>
            <p className="text-[10px] text-purple-700 mt-1">Out for delivery</p>
          </div>
        </div>
      </div>

      {/* History Time Filter Selector */}
      <div className="flex items-center gap-1.5 pt-1">
        <span className="text-[11px] font-bold text-gray-500 mr-1">Period:</span>
        {['today', 'week', 'all'].map((period) => (
          <button
            key={period}
            onClick={() => onTimeFilterChange && onTimeFilterChange(period)}
            className={`text-[11px] font-bold px-3 py-1 rounded-full transition cursor-pointer ${
              timeFilter === period
                ? 'bg-[#0C831F] text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period === 'today' ? 'Today' : period === 'week' ? 'This Week' : 'All Time'}
          </button>
        ))}
      </div>
    </div>
  );
}
