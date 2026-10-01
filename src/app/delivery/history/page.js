'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDeliveryOrders } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import {
  Clock,
  Search,
  CheckCircle,
  XCircle,
  Package,
  MapPin,
  Phone,
  ChevronDown,
  ChevronUp,
  Truck,
  CalendarDays,
  Filter,
} from 'lucide-react';

export default function DeliveryHistoryPage() {
  const { isDelivery, isAdmin } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedOrder, setExpandedOrder] = useState(null);

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

  // Filter orders
  const completedStatuses = ['delivered', 'cancelled'];
  const historyOrders = orders
    .filter((o) => completedStatuses.includes(o.status))
    .sort((a, b) => {
      const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

  const filteredOrders = historyOrders.filter((order) => {
    // Status filter
    if (statusFilter !== 'all' && order.status !== statusFilter) return false;

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const orderNum = (order.orderNumber || order._id || order.id || '').toLowerCase();
      const name = (order.customerName || order.customer?.name || '').toLowerCase();
      const phone = (order.customerPhone || order.customer?.phone || '').toLowerCase();
      return orderNum.includes(q) || name.includes(q) || phone.includes(q);
    }
    return true;
  });

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    delivered: { icon: CheckCircle, label: 'Delivered', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  };

  if (loading) {
    return (
      <div className="p-4 max-w-2xl mx-auto space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200 animate-pulse space-y-2">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-3 w-48 bg-gray-200 rounded" />
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
          <Clock className="w-5 h-5 text-purple-600" />
          Order History
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">
          Complete delivery logs • {historyOrders.length} total orders
        </p>
      </div>

      {/* Search + Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order #, name, or phone..."
            className="w-full text-xs pl-9 pr-3 py-2.5 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-gray-200">
          {[
            { id: 'all', label: 'All' },
            { id: 'delivered', label: '✓ Delivered' },
            { id: 'cancelled', label: '✕ Cancelled' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                statusFilter === f.id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200">
          <CalendarDays className="w-12 h-12 text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-700">
            {searchQuery ? 'No matching orders found' : 'No delivery history yet'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {searchQuery ? 'Try a different search term' : 'Completed deliveries will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredOrders.map((order) => {
            const orderId = order._id || order.id;
            const isExpanded = expandedOrder === orderId;
            const config = statusConfig[order.status] || statusConfig.delivered;
            const StatusIcon = config.icon;
            const address = order.deliveryAddress || order.address || {};
            const items = order.items || [];
            const fee = typeof order.deliveryFee === 'number' && order.deliveryFee > 0 ? order.deliveryFee : 40;

            return (
              <div
                key={orderId}
                className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden"
              >
                {/* Collapsed View */}
                <button
                  onClick={() => setExpandedOrder(isExpanded ? null : orderId)}
                  className="w-full px-4 py-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-gray-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-xl ${config.bg} ${config.border} border`}>
                      <StatusIcon className={`w-4 h-4 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        #{order.orderNumber || orderId?.slice(-6)}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {formatDate(order.updatedAt || order.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-black text-gray-900">
                        {formatPrice(order.total || order.totalAmount || 0)}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold">+{formatPrice(fee)} earned</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-3">
                    {/* Customer Info */}
                    <div className="flex items-start gap-2 text-xs">
                      <Phone className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-bold text-gray-700">
                          {order.customerName || order.customer?.name || 'Customer'}
                        </p>
                        <p className="text-gray-500">
                          {order.customerPhone || order.customer?.phone || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="flex items-start gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <p className="text-gray-600">
                        {typeof address === 'string'
                          ? address
                          : [address.line1, address.line2, address.city, address.pincode]
                              .filter(Boolean)
                              .join(', ') || 'Address not available'}
                      </p>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                      <div className="flex items-start gap-2 text-xs">
                        <Package className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-bold text-gray-700 mb-1">{items.length} item(s)</p>
                          <div className="space-y-0.5">
                            {items.slice(0, 4).map((item, i) => (
                              <p key={i} className="text-gray-500">
                                {item.quantity}× {item.name || item.productName || 'Item'}
                              </p>
                            ))}
                            {items.length > 4 && (
                              <p className="text-gray-400">+{items.length - 4} more items</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold ${config.bg} ${config.color} ${config.border} border`}>
                      <StatusIcon className="w-3.5 h-3.5" />
                      {config.label}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
