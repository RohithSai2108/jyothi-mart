'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  IndianRupee,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Truck,
  CheckCircle,
  Download,
} from 'lucide-react';

export default function DeliveryEarningsPage() {
  const { isDelivery, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('daily');

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getDeliveryOrders({ all: 'true' });
      const list = res.data?.data || res.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDelivery || isAdmin) fetchOrders();
  }, [isDelivery, isAdmin, fetchOrders]);

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  // Time calculations
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = startOfToday - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const getEarnings = (since) =>
    deliveredOrders
      .filter((o) => new Date(o.updatedAt || o.createdAt || 0).getTime() >= since)
      .reduce((sum, o) => {
        const fee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 40;
        return sum + fee;
      }, 0);

  const getCount = (since) =>
    deliveredOrders.filter((o) => new Date(o.updatedAt || o.createdAt || 0).getTime() >= since).length;

  const todayEarnings = getEarnings(startOfToday);
  const yesterdayEarnings = getEarnings(startOfYesterday) - todayEarnings;
  const weekEarnings = getEarnings(startOfWeek);
  const monthEarnings = getEarnings(startOfMonth);
  const totalEarnings = deliveredOrders.reduce((sum, o) => {
    const fee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 40;
    return sum + fee;
  }, 0);

  const todayCount = getCount(startOfToday);
  const weekCount = getCount(startOfWeek);
  const monthCount = getCount(startOfMonth);

  const earningsTrend = yesterdayEarnings > 0
    ? Math.round(((todayEarnings - yesterdayEarnings) / yesterdayEarnings) * 100)
    : 0;

  // Group orders by date for daily breakdown
  const groupedByDate = {};
  deliveredOrders.forEach((o) => {
    const date = new Date(o.updatedAt || o.createdAt || 0).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    if (!groupedByDate[date]) groupedByDate[date] = [];
    groupedByDate[date].push(o);
  });

  const sortedDates = Object.keys(groupedByDate).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-3xl p-5 border border-gray-200 animate-pulse space-y-3">
            <div className="h-5 w-32 bg-gray-200 rounded" />
            <div className="h-8 w-24 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-purple-600" />
          Earnings & Payouts
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Track your delivery income and payout history</p>
      </div>

      {/* Earnings Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today */}
        <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-3xl p-4 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-purple-200">Today&apos;s Earnings</span>
            <Wallet className="w-4 h-4 text-purple-200" />
          </div>
          <p className="text-2xl font-black">{formatPrice(todayEarnings)}</p>
          <div className="flex items-center gap-1 mt-1">
            {earningsTrend >= 0 ? (
              <ArrowUpRight className="w-3 h-3 text-emerald-300" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-red-300" />
            )}
            <span className={`text-[10px] font-bold ${earningsTrend >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>
              {earningsTrend >= 0 ? '+' : ''}{earningsTrend}% vs yesterday
            </span>
          </div>
          <p className="text-[10px] text-purple-200 mt-1">{todayCount} deliveries</p>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500">This Week</span>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(weekEarnings)}</p>
          <p className="text-[10px] text-gray-500 mt-1">{weekCount} deliveries • ₹40/drop</p>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500">This Month</span>
            <TrendingUp className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-2xl font-black text-gray-900">{formatPrice(monthEarnings)}</p>
          <p className="text-[10px] text-gray-500 mt-1">{monthCount} deliveries</p>
        </div>

        {/* All Time */}
        <div className="bg-emerald-50 rounded-3xl p-4 border border-emerald-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-emerald-700">All Time Total</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black text-emerald-900">{formatPrice(totalEarnings)}</p>
          <p className="text-[10px] text-emerald-600 mt-1">{deliveredOrders.length} total deliveries</p>
        </div>
      </div>

      {/* Payout Info */}
      <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 flex items-start gap-3">
        <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-800">Weekly Payout</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Earnings are settled every Monday. Next payout: <strong>{formatPrice(weekEarnings)}</strong>
          </p>
        </div>
      </div>

      {/* Daily Breakdown */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-800">Daily Breakdown</h3>
          <button className="text-[10px] font-bold text-purple-600 flex items-center gap-1 hover:text-purple-700 cursor-pointer">
            <Download className="w-3 h-3" />
            Export
          </button>
        </div>

        {sortedDates.length === 0 ? (
          <div className="p-8 text-center">
            <Truck className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500 font-medium">No deliveries yet</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
            {sortedDates.slice(0, 14).map((date) => {
              const dayOrders = groupedByDate[date];
              const dayEarnings = dayOrders.reduce((sum, o) => {
                const fee = typeof o.deliveryFee === 'number' && o.deliveryFee > 0 ? o.deliveryFee : 40;
                return sum + fee;
              }, 0);

              return (
                <div key={date} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-800">{date}</p>
                    <p className="text-[10px] text-gray-500">{dayOrders.length} deliveries</p>
                  </div>
                  <span className="text-sm font-black text-emerald-700">{formatPrice(dayEarnings)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
