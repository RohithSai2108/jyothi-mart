'use client';
import { useState } from 'react';
import {
  Truck,
  Navigation,
  CheckCircle,
  Phone,
  MapPin,
  Package,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Map,
  Clock,
  AlertCircle,
  Check,
} from 'lucide-react';
import { formatPrice, formatDate, getOrderStatusLabel } from '@/lib/utils';

import DeliveryRouteMap from './DeliveryRouteMap';

const STATUS_STYLES = {
  placed: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  packing: 'bg-orange-50 text-orange-700 border-orange-200',
  out_for_delivery: 'bg-purple-50 text-purple-700 border-purple-200',
  delivered: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export default function DeliveryOrderCard({
  order,
  onUpdateStatus,
  onOpenOtpModal,
  isUpdating = false,
}) {
  const [showItems, setShowItems] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const orderId = order._id || order.id || '';
  const statusKey = order.status?.toLowerCase() || 'placed';
  const badgeClass = STATUS_STYLES[statusKey] || 'bg-gray-100 text-gray-700 border-gray-200';
  const displayOrderNumber =
    order.orderNumber ||
    (typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : `#${orderId}`);

  const customerName =
    order.customerName ||
    (typeof order.customer === 'object' ? order.customer?.name : '') ||
    'Customer';

  const customerPhone =
    order.customerPhone ||
    (typeof order.customer === 'object' ? order.customer?.phone : '') ||
    '';

  const formatAddress = (addr) => {
    if (!addr) return 'No address provided';
    if (typeof addr === 'string') return addr;
    const parts = [
      addr.fullAddress || addr.addressLine1 || addr.address,
      addr.landmark ? `Near ${addr.landmark}` : null,
      addr.city,
      addr.pincode,
    ].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'Address on file';
  };

  const formattedAddress = formatAddress(order.deliveryAddress);

  const getNavigationUrl = () => {
    const addr = order.deliveryAddress;
    if (addr && addr.lat && addr.lng) {
      return `https://www.google.com/maps/dir/?api=1&destination=${addr.lat},${addr.lng}`;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(formattedAddress)}`;
  };

  const getWhatsAppUrl = () => {
    if (!customerPhone) return '#';
    const cleanPhone = customerPhone.replace(/\D/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const msg = encodeURIComponent(
      `Hello ${customerName}! I am your Jyothi Mart delivery partner on my way with your order ${displayOrderNumber}.`
    );
    return `https://wa.me/${phoneWithCountry}?text=${msg}`;
  };

  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-200 shadow-sm space-y-3.5 transition hover:border-gray-300">
      {/* Header: Order # + Amount + Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="font-black text-sm text-gray-900">{displayOrderNumber}</span>
          <span className="text-xs text-gray-400">•</span>
          <span className="text-xs font-bold text-gray-800">
            {formatPrice(order.grandTotal || 0)}
          </span>
          <span className="text-[10px] text-gray-400">
            ({order.paymentMethod || 'COD'})
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border uppercase tracking-wider ${badgeClass}`}
        >
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      {/* Customer Contact Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-100 text-xs">
        <div className="flex items-center space-x-1.5 text-gray-700">
          <span className="font-bold text-gray-900">{customerName}</span>
          {customerPhone && <span className="text-gray-500 font-mono text-[11px]">+91 {customerPhone}</span>}
        </div>

        {customerPhone && (
          <div className="flex items-center gap-1.5">
            <a
              href={`tel:${customerPhone}`}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-50 hover:bg-green-100 text-[#0C831F] font-bold rounded-lg transition"
              title="Call Customer"
            >
              <Phone className="w-3 h-3" />
              <span>Call</span>
            </a>
            <a
              href={getWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg transition"
              title="WhatsApp Customer"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
          </div>
        )}
      </div>

      {/* Delivery Address Box */}
      <div className="flex items-start space-x-2 text-xs text-gray-700 bg-gray-50/80 p-3 rounded-2xl border border-gray-150">
        <MapPin className="w-4 h-4 text-[#0C831F] flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium leading-relaxed">{formattedAddress}</p>
          {order.deliveryAddress?.landmark && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              Landmark: {order.deliveryAddress.landmark}
            </p>
          )}
        </div>
      </div>

      {/* Delivery Notes / Special Instructions if any */}
      {order.deliveryNotes && (
        <div className="text-xs text-amber-800 bg-amber-50 px-3 py-2 rounded-xl border border-amber-200 flex items-start gap-1.5">
          <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong>Note:</strong> {order.deliveryNotes}
          </p>
        </div>
      )}

      {/* Items Summary & Expandable List */}
      <div className="border border-gray-150 rounded-2xl p-2.5 bg-white">
        <button
          onClick={() => setShowItems(!showItems)}
          className="w-full flex items-center justify-between text-xs text-gray-700 cursor-pointer"
        >
          <div className="flex items-center space-x-1.5">
            <Package className="w-3.5 h-3.5 text-gray-500" />
            <span className="font-bold">
              {items.length} {items.length === 1 ? 'item' : 'items'} in order
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-gray-500">
            <span>{showItems ? 'Hide' : 'View'}</span>
            {showItems ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>
        </button>

        {showItems && (
          <div className="mt-2.5 pt-2 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
            {items.map((it, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="truncate pr-2">
                  <span className="font-bold text-gray-900">{it.qty || 1}x</span> {it.name}
                </span>
                <span className="font-mono text-gray-700 flex-shrink-0">
                  {formatPrice((it.price || 0) * (it.qty || 1))}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lazy Map Preview Toggle */}
      <div className="pt-0.5">
        <button
          onClick={() => setShowMap(!showMap)}
          className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
        >
          <Map className="w-3.5 h-3.5" />
          <span>{showMap ? 'Hide Map Route' : 'Show Location on Map'}</span>
        </button>

        {showMap && (
          <div className="mt-2.5 rounded-2xl overflow-hidden border border-gray-200">
            <DeliveryRouteMap
              orders={[order]}
              selectedOrderId={orderId}
              storeCenter={{ lat: 18.8256, lng: 78.9135 }}
            />
          </div>
        )}
      </div>

      {/* Action Buttons Row */}
      <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
        {/* Navigation Button */}
        <a
          href={getNavigationUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center space-x-1.5 bg-blue-50 text-blue-700 border border-blue-200 py-2.5 rounded-xl text-xs font-bold hover:bg-blue-100 transition active:scale-95"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Directions</span>
        </a>

        {/* Status Action: Pick Up (confirmed or packing) */}
        {(statusKey === 'confirmed' || statusKey === 'packing') && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onUpdateStatus(orderId, 'out_for_delivery')}
            className="flex-1 flex items-center justify-center space-x-1.5 bg-purple-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-purple-700 transition disabled:opacity-50 active:scale-95 shadow-sm cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>{isUpdating ? 'Updating...' : 'Pick Up Order'}</span>
          </button>
        )}

        {/* Status Action: Mark Delivered (out_for_delivery) */}
        {statusKey === 'out_for_delivery' && (
          <button
            type="button"
            disabled={isUpdating}
            onClick={() => onOpenOtpModal(order)}
            className="flex-1 flex items-center justify-center space-x-1.5 bg-[#0C831F] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-green-700 transition disabled:opacity-50 active:scale-95 shadow-sm cursor-pointer"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Mark Delivered</span>
          </button>
        )}
      </div>
    </div>
  );
}
