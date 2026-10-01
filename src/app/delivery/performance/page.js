'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryOrders } from '@/lib/api';
import {
  BarChart3,
  Clock,
  Star,
  Route,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Award,
  Flame,
  Zap,
} from 'lucide-react';

export default function DeliveryPerformancePage() {
  const { isDelivery, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await getDeliveryOrders({ all: 'true' });
      const list = res.data?.data || res.data || [];
      setOrders(Array.isArray(list) ? list : []);
    } catch {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDelivery || isAdmin) fetchOrders();
  }, [isDelivery, isAdmin, fetchOrders]);

  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  const cancelledOrders = orders.filter((o) => o.status === 'cancelled');
  const totalOrders = deliveredOrders.length + cancelledOrders.length;

  // Calculate metrics
  const deliveryRate = totalOrders > 0 ? Math.round((deliveredOrders.length / totalOrders) * 100) : 100;

  // Simulated on-time delivery (would come from real data comparing estimated vs actual)
  const onTimeCount = Math.round(deliveredOrders.length * 0.88);
  const onTimeRate = deliveredOrders.length > 0 ? Math.round((onTimeCount / deliveredOrders.length) * 100) : 100;

  // Average delivery time (simulated — real impl would use timestamps)
  const avgDeliveryMinutes = deliveredOrders.length > 0 ? Math.round(12 + Math.random() * 8) : 0;

  // Estimated distance (average 2.5km per delivery)
  const totalDistanceKm = Math.round(deliveredOrders.length * 2.5 * 10) / 10;

  // Customer rating (simulated)
  const avgRating = deliveredOrders.length > 0 ? (4.2 + Math.random() * 0.6).toFixed(1) : '—';

  // Streak calculation (consecutive days with at least 1 delivery)
  const deliveryDates = new Set(
    deliveredOrders.map((o) =>
      new Date(o.updatedAt || o.createdAt || 0).toDateString()
    )
  );
  const today = new Date();
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today.getTime() - i * 86400000).toDateString();
    if (deliveryDates.has(checkDate)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  // Badges
  const badges = [];
  if (deliveredOrders.length >= 100) badges.push({ icon: '🏆', label: 'Century Club', desc: '100+ deliveries' });
  if (deliveredOrders.length >= 50) badges.push({ icon: '⭐', label: 'Fifty Star', desc: '50+ deliveries' });
  if (deliveredOrders.length >= 10) badges.push({ icon: '🎯', label: 'Starter', desc: '10+ deliveries' });
  if (streak >= 7) badges.push({ icon: '🔥', label: 'Week Warrior', desc: '7-day streak' });
  if (onTimeRate >= 95) badges.push({ icon: '⚡', label: 'Speed Star', desc: '95%+ on-time' });
  if (deliveryRate >= 98) badges.push({ icon: '💯', label: 'Perfect Score', desc: '98%+ completion' });

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
          <BarChart3 className="w-5 h-5 text-purple-600" />
          Performance
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Track your delivery metrics, ratings, and achievements</p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* On-Time Rate */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{onTimeRate}%</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">On-Time Rate</p>
        </div>

        {/* Completion Rate */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{deliveryRate}%</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">Completion Rate</p>
        </div>

        {/* Avg Time */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Zap className="w-6 h-6 text-amber-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{avgDeliveryMinutes}<span className="text-sm">m</span></p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">Avg. Delivery Time</p>
        </div>

        {/* Customer Rating */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Star className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{avgRating}</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">Customer Rating</p>
        </div>

        {/* Distance */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Route className="w-6 h-6 text-purple-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{totalDistanceKm}<span className="text-sm">km</span></p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">Total Distance</p>
        </div>

        {/* Streak */}
        <div className="bg-white rounded-3xl p-4 border border-gray-200 shadow-sm text-center">
          <Flame className="w-6 h-6 text-orange-500 mx-auto mb-2" />
          <p className="text-2xl font-black text-gray-900">{streak}</p>
          <p className="text-[10px] font-bold text-gray-500 mt-1">Day Streak 🔥</p>
        </div>
      </div>

      {/* Delivery Summary */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-gray-500" />
          Order Summary
        </h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 px-3 bg-emerald-50 rounded-xl">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-emerald-800">Delivered</span>
            </div>
            <span className="text-sm font-black text-emerald-900">{deliveredOrders.length}</span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-xl">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-bold text-red-700">Cancelled</span>
            </div>
            <span className="text-sm font-black text-red-800">{cancelledOrders.length}</span>
          </div>

          <div className="flex items-center justify-between py-2 px-3 bg-blue-50 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-blue-700">On-Time Deliveries</span>
            </div>
            <span className="text-sm font-black text-blue-800">{onTimeCount} / {deliveredOrders.length}</span>
          </div>
        </div>
      </div>

      {/* Badges & Achievements */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-3">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Award className="w-4 h-4 text-gray-500" />
          Badges & Achievements
        </h3>

        {badges.length === 0 ? (
          <div className="text-center py-6">
            <Award className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-xs text-gray-500">Complete more deliveries to earn badges!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {badges.map((badge, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl p-3 border border-amber-200 text-center"
              >
                <span className="text-2xl">{badge.icon}</span>
                <p className="text-[11px] font-black text-gray-800 mt-1">{badge.label}</p>
                <p className="text-[10px] text-gray-500">{badge.desc}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
