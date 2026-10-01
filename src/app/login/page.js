'use client';
import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  ArrowRight,
  Loader2,
  Truck,
  ShoppingBag,
  Sparkles,
} from 'lucide-react';
import { sendOtp } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

function LoginFormContent() {
  const searchParams = useSearchParams();
  const initialRedirect = searchParams.get('redirect') || '';
  const initialPortalParam = searchParams.get('portal') || '';

  // Determine initial active portal tab
  const getInitialPortal = () => {
    if (initialPortalParam === 'delivery' || initialRedirect.startsWith('/delivery')) {
      return 'delivery';
    }
    if (initialPortalParam === 'admin' || initialRedirect.startsWith('/admin')) {
      return 'admin';
    }
    return 'customer';
  };

  const [activePortal, setActivePortal] = useState(getInitialPortal);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const { login } = useAuth();
  const router = useRouter();

  const clearRecaptcha = () => {
    if (typeof window !== 'undefined' && window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch (e) {
        console.warn('Error clearing recaptcha:', e);
      }
      window.recaptchaVerifier = null;
    }
  };

  useEffect(() => {
    return () => clearRecaptcha();
  }, []);

  useEffect(() => {
    let timer;
    if (step === 2 && countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, countdown]);

  const getRecaptchaVerifier = () => {
    if (!auth) throw new Error('Auth not initialized');
    clearRecaptcha();
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-page', {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => setError('reCAPTCHA expired. Please try again.'),
    });
    window.recaptchaVerifier = verifier;
    return verifier;
  };

  const handleSendOtp = async (e) => {
    e?.preventDefault?.();
    const cleanPhone = phone.replace(/\D/g, '').trim();
    if (!cleanPhone || cleanPhone.length !== 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await sendOtp(cleanPhone);
      const appVerifier = getRecaptchaVerifier();
      const confirmation = await signInWithPhoneNumber(auth, `+91${cleanPhone}`, appVerifier);
      setConfirmationResult(confirmation);
      setStep(2);
      setCountdown(30);
    } catch (err) {
      console.error('Failed to send OTP:', err);
      clearRecaptcha();
      let msg = 'Failed to send OTP. Please check your number.';
      if (err.code === 'auth/invalid-phone-number') msg = 'Invalid mobile number format.';
      else if (err.code === 'auth/operation-not-allowed')
        msg = 'SMS for India (+91) must be enabled in Firebase Console: Authentication > Settings > SMS region policy.';
      else if (err.code === 'auth/quota-exceeded')
        msg = 'SMS quota exceeded for today. You can still test with OTP 1234.';
      else if (err.code === 'auth/unauthorized-domain')
        msg = 'Domain not authorized in Firebase Console.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const getTargetDestination = () => {
    if (initialRedirect) return initialRedirect;
    if (activePortal === 'delivery') return '/delivery';
    if (activePortal === 'admin') return '/admin';
    return '/';
  };

  const handleVerify = async (e) => {
    e?.preventDefault?.();
    const cleanOtp = otp.trim();
    const cleanPhone = phone.replace(/\D/g, '').trim();

    if (!cleanOtp || (cleanOtp.length !== 6 && cleanOtp !== '1234')) {
      setError('Please enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let firebaseToken = null;
      let firebaseUid = null;

      const roleOverride = activePortal === 'delivery' ? 'delivery' : null;

      if (cleanOtp === '1234') {
        await login(cleanPhone, cleanOtp, null, null, roleOverride);
      } else if (confirmationResult) {
        const userCredential = await confirmationResult.confirm(cleanOtp);
        firebaseToken = await userCredential.user.getIdToken();
        firebaseUid = userCredential.user.uid;
        await login(cleanPhone, cleanOtp, firebaseToken, firebaseUid, roleOverride);
      } else {
        await login(cleanPhone, cleanOtp, null, null, roleOverride);
      }

      router.push(getTargetDestination());
    } catch (err) {
      console.error('Login error:', err);
      let msg = 'Invalid OTP. Please check the code and try again.';
      if (err.code === 'auth/invalid-verification-code') msg = 'Incorrect 6-digit OTP.';
      else if (err.response?.data?.message) msg = err.response.data.message;
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Instant 1-click Demo Login for any of the 3 portals
  const handleQuickDemoLogin = async (portalType) => {
    setQuickLoginLoading(true);
    setError('');
    try {
      if (portalType === 'delivery') {
        await login('9876500001', '1234', null, null, 'delivery');
        router.push('/delivery');
      } else if (portalType === 'admin') {
        await login('1234567890', '1234', null, null, 'admin');
        router.push('/admin');
      } else {
        await login('9876543210', '1234', null, null, 'customer');
        router.push('/');
      }
    } catch (err) {
      console.error('Quick demo login error:', err);
      setError('Quick login failed. Please try with OTP.');
    } finally {
      setQuickLoginLoading(false);
    }
  };

  // Theming based on selected portal
  const portalTheme = {
    customer: {
      accent: '#0C831F',
      btnBg: 'bg-[#0C831F] hover:bg-green-700',
      badgeBg: 'bg-green-50 text-[#0C831F] border-green-200',
      title: 'Customer Portal',
      subtitle: 'Order fresh groceries in 10 minutes',
      badgeText: 'Customer',
    },
    delivery: {
      accent: '#7C3AED',
      btnBg: 'bg-purple-600 hover:bg-purple-700',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      title: 'Delivery Partner Portal',
      subtitle: 'Order dispatch, maps & earnings',
      badgeText: 'Delivery Boy',
    },
    admin: {
      accent: '#0F172A',
      btnBg: 'bg-slate-900 hover:bg-black',
      badgeBg: 'bg-slate-100 text-slate-800 border-slate-300',
      title: 'Admin Control Center',
      subtitle: 'Manage store catalog, inventory & orders',
      badgeText: 'Store Admin',
    },
  }[activePortal];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-7 sm:p-8 rounded-3xl shadow-sm border border-gray-100 w-full max-w-sm sm:max-w-md">
        {/* Three Portals Selector Tab */}
        <div className="flex bg-gray-100 p-1 rounded-2xl mb-6 text-xs font-bold">
          <button
            type="button"
            onClick={() => {
              setActivePortal('customer');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePortal === 'customer'
                ? 'bg-white text-[#0C831F] shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Customer</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePortal('delivery');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePortal === 'delivery'
                ? 'bg-white text-purple-700 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Delivery Boy</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActivePortal('admin');
              setError('');
            }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
              activePortal === 'admin'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Portal Header */}
        <div className="text-center mb-6">
          <div
            className={`w-12 h-12 rounded-2xl border flex items-center justify-center mx-auto mb-3 font-extrabold text-xl ${portalTheme.badgeBg}`}
          >
            {activePortal === 'delivery' ? (
              <Truck className="w-6 h-6" />
            ) : activePortal === 'admin' ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              'JM'
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight">
            {portalTheme.title}
          </h1>
          <p className="text-xs text-gray-500 mt-1">{portalTheme.subtitle}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-3.5 py-2.5 rounded-xl border border-red-200 mb-4">
            {error}
          </div>
        )}

        <div id="recaptcha-container-page"></div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500">
                  +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full border border-gray-200 rounded-xl pl-12 pr-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                  placeholder="9876543210"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || phone.length < 10}
              className={`w-full ${portalTheme.btnBg} disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed`}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wider">
                6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-center tracking-widest text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-purple-400 transition"
                placeholder="• • • • • •"
                autoFocus
              />
              <p className="text-[11px] text-gray-400 text-center mt-1.5">
                Enter the OTP sent via SMS (or 1234 for testing)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || (otp.length !== 6 && otp !== '1234')}
              className={`w-full ${portalTheme.btnBg} disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3 rounded-xl transition shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Enter {portalTheme.badgeText}</span>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setError('');
                  setOtp('');
                  setConfirmationResult(null);
                }}
                className="text-xs text-gray-500 hover:text-gray-800 transition"
              >
                Change Number
              </button>

              {countdown > 0 ? (
                <span className="text-xs text-gray-400 select-none">
                  Resend in {countdown}s
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs font-bold text-purple-600 hover:underline"
                >
                  Resend OTP
                </button>
              )}
            </div>
          </form>
        )}

        {/* 1-Click Fast Demo Login Switcher */}
        <div className="mt-6 pt-5 border-t border-gray-100">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center mb-2.5">
            Quick 1-Click Demo Login
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={quickLoginLoading}
              onClick={() => handleQuickDemoLogin('customer')}
              className="px-2 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[11px] font-bold text-center transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-600" />
              <span>Customer</span>
            </button>
            <button
              type="button"
              disabled={quickLoginLoading}
              onClick={() => handleQuickDemoLogin('delivery')}
              className="px-2 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-800 text-[11px] font-bold text-center transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Truck className="w-3.5 h-3.5 text-purple-600" />
              <span>Delivery Boy</span>
            </button>
            <button
              type="button"
              disabled={quickLoginLoading}
              onClick={() => handleQuickDemoLogin('admin')}
              className="px-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-[11px] font-bold text-center transition active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-slate-700" />
              <span>Admin</span>
            </button>
          </div>
          {quickLoginLoading && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-purple-600 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Signing into portal...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Loader2 className="w-8 h-8 text-[#0C831F] animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
