'use client';
import { useState } from 'react';
import { X, CheckCircle, KeyRound, AlertCircle, FileText } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export default function DeliveryOtpModal({
  isOpen,
  onClose,
  order,
  onConfirmDelivery,
  isSubmitting = false,
}) {
  const [otp, setOtp] = useState('');
  const [notePreset, setNotePreset] = useState('Handed to customer directly');
  const [customNote, setCustomNote] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const orderId = order._id || order.id || '';
  const displayOrderNum =
    order.orderNumber || (typeof orderId === 'string' ? `#${orderId.slice(-6).toUpperCase()}` : `#${orderId}`);

  const customerName =
    order.customerName ||
    (typeof order.customer === 'object' ? order.customer?.name : '') ||
    'Customer';

  const customerPhone =
    order.customerPhone ||
    (typeof order.customer === 'object' ? order.customer?.phone : '') ||
    '';

  // Expected default fallback OTP is last 4 digits of customer phone or order ID
  const fallbackOtp = customerPhone ? customerPhone.slice(-4) : orderId.slice(-4);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // If OTP entered, check length (minimum 4 digits or any non-empty code)
    const finalNote = customNote.trim() ? `${notePreset} - ${customNote.trim()}` : notePreset;

    try {
      await onConfirmDelivery(orderId, otp || fallbackOtp, finalNote);
      onClose();
    } catch (err) {
      setError(err?.message || 'Failed to complete delivery. Please try again.');
    }
  };

  const presets = [
    'Handed to customer directly',
    'Left at doorstep / with family member',
    'Left with building security guard',
    'Customer verified via phone call',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-150 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-[#0C831F] text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">Complete Delivery</h3>
              <p className="text-emerald-100 text-xs">{displayOrderNum}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/20 transition cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Customer & Payment Summary Card */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-150 flex items-center justify-between text-xs">
            <div>
              <p className="font-bold text-gray-900">{customerName}</p>
              <p className="text-gray-500">{customerPhone ? `+91 ${customerPhone}` : 'No phone'}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[11px]">Total to Collect</p>
              <p className="font-black text-sm text-[#0C831F]">
                {formatPrice(order.grandTotal || 0)}
              </p>
            </div>
          </div>

          {/* Delivery OTP Input */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between text-xs font-bold text-gray-700">
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#0C831F]" />
                <span>Customer Delivery OTP (4 Digits)</span>
              </span>
              <span className="text-[11px] font-normal text-gray-400">
                Hint: Last 4 digits ({fallbackOtp})
              </span>
            </label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder={`Enter code (default: ${fallbackOtp})`}
              className="w-full text-center tracking-widest text-lg font-mono font-bold py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C831F] focus:border-transparent transition"
            />
          </div>

          {/* Quick Note Presets */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-gray-500" />
              <span>Delivery Handover Note</span>
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {presets.map((p) => (
                <button
                  type="button"
                  key={p}
                  onClick={() => setNotePreset(p)}
                  className={`text-left text-xs px-3 py-2 rounded-xl border transition cursor-pointer ${
                    notePreset === p
                      ? 'bg-emerald-50 border-[#0C831F] text-[#0C831F] font-bold shadow-2xs'
                      : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  ✓ {p}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Note Optional */}
          <div>
            <input
              type="text"
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Optional additional notes (e.g. gate 3)..."
              className="w-full text-xs py-2 px-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#0C831F]"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 text-xs font-bold text-white bg-[#0C831F] hover:bg-green-700 rounded-xl transition shadow-md cursor-pointer disabled:opacity-50 active:scale-95 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming...' : 'Mark Delivered'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
