'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  ShoppingBag,
  Loader2,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useLocation } from '@/context/LocationContext';
import { placeOrder } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import LocationPickerModal from '@/components/common/LocationPickerModal';

export default function CheckoutPage() {
  const { user, loading: authLoading, openLoginModal } = useAuth();
  const { cartItems, cartTotal, clearCart } = useCart();
  const {
    address,
    coords,
    isServiceable,
    distanceKm,
    deliveryTimeEstimate,
    storeInfo,
    selectLocation,
  } = useLocation();
  const router = useRouter();

  const [flatNo, setFlatNo] = useState('');
  const [floor, setFloor] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  // Fallback store coordinates (Metpally, Telangana)
  const storeCenter = storeInfo?.deliveryZone?.center || {
    lat: 18.84570256581069,
    lng: 78.62641714181535,
  };

  const handleSetMetpallyDefault = () => {
    selectLocation(storeCenter, {
      short: 'Metpally Town, Telangana',
      formatted: 'Metpally Town, Jagtial District, Telangana',
      locality: 'Metpally',
      city: 'Metpally',
    });
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-[#0C831F] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm max-w-sm w-full text-center space-y-4">
          <div className="w-14 h-14 bg-green-50 text-[#0C831F] rounded-2xl flex items-center justify-center mx-auto border border-green-200">
            <Phone className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-black text-gray-900">Sign in to Checkout</h2>
            <p className="text-xs text-gray-500 mt-1">
              Please login with your mobile number to view address and place your order.
            </p>
          </div>
          <button
            onClick={() => {
              if (typeof openLoginModal === 'function') {
                openLoginModal();
              } else {
                router.push('/login?redirect=/checkout');
              }
            }}
            className="w-full bg-[#0C831F] hover:bg-green-700 text-white font-extrabold py-3 px-6 rounded-2xl text-sm transition cursor-pointer shadow-md"
          >
            Log In with Mobile Number
          </button>
          <Link
            href="/cart"
            className="block text-xs font-bold text-gray-500 hover:text-gray-900 transition"
          >
            &larr; Back to Cart
          </Link>
        </div>
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
        <ShoppingBag className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-sm text-gray-600 mb-3">Your cart is empty</p>
        <Link
          href="/"
          className="bg-[#0C831F] text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-sm"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const deliveryFee = typeof storeInfo?.deliveryFee === 'number' ? storeInfo.deliveryFee : 0;
  const grandTotal = (cartTotal || 0) + deliveryFee;

  // Extract clean 24-char ObjectId even for variants (e.g. "66db3582..._4 kg" -> "66db3582...")
  const cleanId = (item) =>
    item.productId || (item.itemId ? String(item.itemId).split('_')[0] : item._id);

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError('');

    const effectiveAddressParts = [
      flatNo,
      floor ? `Floor: ${floor}` : '',
      landmark ? `Near ${landmark}` : '',
      address && address !== 'Detecting location...' ? address : 'Metpally',
    ].filter(Boolean);

    const fullAddress = effectiveAddressParts.join(', ');

    // Fallback coordinates to store center if GPS coords not captured
    const lat = coords?.lat || storeCenter.lat;
    const lng = coords?.lng || storeCenter.lng;

    try {
      const orderData = {
        items: cartItems.map((item) => ({
          itemId: cleanId(item),
          name: item.name,
          variantId: item.variantId || null,
          variantLabel: item.variantLabel || null,
          unit: item.unit || '',
          price: Number(item.price),
          qty: Number(item.qty) || 1,
        })),
        deliveryAddress: {
          label: 'Home',
          fullAddress: fullAddress || 'Metpally, Telangana',
          lat,
          lng,
          confirmedManual: true,
        },
        paymentMethod: 'cod',
        deliveryNotes: deliveryNotes.trim(),
      };

      const res = await placeOrder(orderData);
      const order = res.data?.data || res.data;
      clearCart();
      router.push(`/orders/${order?._id || order?.id || ''}`);
    } catch (err) {
      console.error('Order placement failed:', err);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'Failed to place order. Please check address and try again.';
      setError(msg);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 py-3.5 shadow-2xs">
        <div className="flex items-center space-x-3 max-w-2xl mx-auto">
          <Link
            href="/cart"
            className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 transition text-gray-700"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-base font-extrabold text-gray-900 leading-tight">Checkout</h1>
            <p className="text-xs text-gray-500">
              {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} · Cash on Delivery
            </p>
          </div>
        </div>
      </header>

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        {/* Delivery Address Card */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0C831F]" />
              Delivery Address
            </h3>
            <button
              onClick={() => setLocationPickerOpen(true)}
              className="text-xs font-bold text-[#0C831F] hover:underline cursor-pointer"
            >
              Pin on Map
            </button>
          </div>

          {/* Location status badge */}
          {coords?.lat ? (
            <div className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-1">
              <p className="font-bold text-gray-900">
                {address && address !== 'Detecting location...'
                  ? address
                  : 'Metpally Town, Telangana'}
              </p>
              {distanceKm !== null && distanceKm !== undefined && (
                <p className="text-[11px] text-gray-500">
                  {distanceKm} km from store
                  {deliveryTimeEstimate ? ` · Est. ${deliveryTimeEstimate}` : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <button
                onClick={handleSetMetpallyDefault}
                className="w-full py-2.5 px-3 bg-emerald-50 border border-emerald-200 text-[#0C831F] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-100 transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                Deliver in Metpally Town / Store Area
              </button>
            </div>
          )}

          {/* Address Detail Inputs */}
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">
                House / Flat / Building / Street Address *
              </label>
              <input
                type="text"
                value={flatNo}
                onChange={(e) => setFlatNo(e.target.value)}
                placeholder="e.g. H.No 4-52, Near Old Bus Stand, Metpally"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Floor (Optional)</label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 1st Floor / Ground"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Opp. Venkateshwara Temple"
                  className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
                />
              </div>
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 mb-1">Delivery Notes (Optional)</label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Ring the bell, leave at security"
                className="w-full text-xs px-3 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#0C831F]"
              />
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
          <h3 className="text-sm font-extrabold text-gray-900 mb-2">Payment Method</h3>
          <div className="flex items-center space-x-2.5 text-xs text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
            <input type="radio" checked readOnly className="accent-[#0C831F] w-4 h-4" />
            <div>
              <span className="font-extrabold block text-gray-900">Cash on Delivery (COD)</span>
              <span className="text-[11px] text-gray-500">Pay cash or UPI upon delivery to doorstep</span>
            </div>
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs space-y-2.5">
          <h3 className="text-sm font-extrabold text-gray-900">Bill Summary</h3>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Item total ({cartItems.length} items)</span>
            <span className="font-bold text-gray-900">{formatPrice(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-xs text-gray-600">
            <span>Delivery fee</span>
            <span className="font-bold text-[#0C831F]">
              {deliveryFee > 0 ? formatPrice(deliveryFee) : 'FREE'}
            </span>
          </div>
          <div className="border-t border-gray-200 pt-2.5 flex justify-between text-sm font-black text-gray-900">
            <span>Grand Total</span>
            <span className="text-[#0C831F] text-base">{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <p className="font-bold">{error}</p>
          </div>
        )}

        {/* Place Order Button */}
        <button
          onClick={handlePlaceOrder}
          disabled={placing}
          className={`w-full py-3.5 rounded-2xl text-sm font-black transition active:scale-[0.98] shadow-md ${
            placing
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-[#0C831F] text-white hover:bg-green-700 cursor-pointer'
          }`}
        >
          {placing ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Placing Your Order...
            </span>
          ) : (
            `Place Order · ${formatPrice(grandTotal)} (Cash on Delivery)`
          )}
        </button>
      </main>

      <LocationPickerModal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
      />
    </div>
  );
}
