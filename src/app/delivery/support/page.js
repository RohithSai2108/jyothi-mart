'use client';
import { useState } from 'react';
import {
  Phone,
  MessageCircle,
  HelpCircle,
  AlertTriangle,
  ChevronDown,
  Send,
  CheckCircle,
  Clock,
  ShieldAlert,
  MapPin,
  FileQuestion,
} from 'lucide-react';

const FAQS = [
  {
    q: 'How do I complete a delivery?',
    a: 'When you arrive at the customer location, hand over the items and ask the customer for the 4-digit Delivery OTP sent to their SMS. Enter the OTP into your app to complete the order and credit your delivery fee.',
  },
  {
    q: 'What if the customer is unreachable or not answering?',
    a: 'Try calling the customer at least twice using the "Call Customer" button. Wait for 5 minutes. If still unreachable, tap "Report Issue" below or contact store dispatch immediately before leaving the area.',
  },
  {
    q: 'When and how are my delivery payouts transferred?',
    a: 'Payouts are processed automatically every Tuesday directly to your registered UPI ID or Bank account. You can track your daily earnings and payout history in the Earnings tab.',
  },
  {
    q: 'How are delivery partner earnings calculated?',
    a: 'You earn a base rate of ₹40 per completed delivery. Additional incentives apply for peak hours (6 PM - 9 PM), rainy weather bonus (+₹15), and distance bonus for deliveries beyond 3 km.',
  },
  {
    q: 'What should I do in case of a vehicle breakdown or flat tyre?',
    a: 'Safety first! Immediately notify store dispatch using the Emergency Hotline below so they can re-assign active orders to another partner without customer delay.',
  },
  {
    q: 'How do I toggle Online/Offline duty?',
    a: 'You can tap the ONLINE / OFFLINE toggle located at the top right of your header dashboard. Note that you cannot go offline while you have active orders in progress.',
  },
];

export default function DeliverySupportPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState(0);
  const [issueType, setIssueType] = useState('customer_unreachable');
  const [issueNote, setIssueNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitIssue = (e) => {
    e.preventDefault();
    if (!issueNote.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIssueNote('');
    }, 4000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black text-gray-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-purple-600" />
          Partner Support & Helpdesk
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Direct assistance for Jyothi Mart delivery partners in Metpally.
        </p>
      </div>

      {/* Emergency Hotline Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-purple-300 text-xs font-bold">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Store Dispatch Hotline
            </div>
            <p className="text-lg font-black tracking-tight">+91 98480 12345</p>
            <p className="text-[11px] text-purple-200">Available 7:00 AM – 10:00 PM</p>
          </div>
          <a
            href="tel:+919848012345"
            className="w-11 h-11 bg-white/20 hover:bg-white/30 text-white rounded-xl flex items-center justify-center transition active:scale-95 border border-white/20"
          >
            <Phone className="w-5 h-5" />
          </a>
        </div>

        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 text-white p-4 rounded-2xl shadow-md flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-emerald-300 text-xs font-bold">
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              WhatsApp Partner Desk
            </div>
            <p className="text-lg font-black tracking-tight">+91 94401 56789</p>
            <p className="text-[11px] text-emerald-200">Instant chat for live delivery help</p>
          </div>
          <a
            href="https://wa.me/919440156789?text=Hello%20Jyothi%20Mart%20Dispatch,%20I%20am%20a%20delivery%20partner%20and%20need%20assistance."
            target="_blank"
            rel="noopener noreferrer"
            className="w-11 h-11 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl flex items-center justify-center transition active:scale-95 shadow-sm"
          >
            <MessageCircle className="w-5 h-5" />
          </a>
        </div>
      </div>

      {/* Store Location & Hub Info */}
      <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-gray-900">Main Fulfillment Hub</p>
          <p className="text-[11px] text-gray-500 truncate">
            Jyothi Mart Store, Main Road, Near Bus Stand, Metpally - 505325
          </p>
        </div>
        <a
          href="https://maps.google.com/?q=18.8256,78.9135"
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-bold text-purple-600 hover:underline flex-shrink-0"
        >
          Navigate →
        </a>
      </div>

      {/* Report Active Issue Form */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Report Delivery Incident / Issue
        </h2>

        {submitted ? (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold">Incident logged successfully</p>
              <p className="text-emerald-700 mt-0.5">
                Store dispatch has been notified and will contact you within 2 minutes.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmitIssue} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Select Problem Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full text-xs font-medium border border-gray-200 rounded-xl px-3 py-2.5 bg-gray-50 focus:bg-white focus:outline-none focus:border-purple-500"
              >
                <option value="customer_unreachable">Customer not answering phone / door</option>
                <option value="address_incorrect">Address / Location pin incorrect</option>
                <option value="vehicle_breakdown">Vehicle breakdown / puncture</option>
                <option value="item_damaged">Damaged or missing item in package</option>
                <option value="customer_refused">Customer refused order / payment issue</option>
                <option value="other">Other issue</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Details & Order Number (if applicable)
              </label>
              <textarea
                rows={3}
                value={issueNote}
                onChange={(e) => setIssueNote(e.target.value)}
                placeholder="E.g., Order #1042 - Customer phone is switched off since 10 mins..."
                className="w-full text-xs border border-gray-200 rounded-xl p-3 bg-gray-50 focus:bg-white focus:outline-none focus:border-purple-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              Notify Store Dispatch
            </button>
          </form>
        )}
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-3">
        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-2">
          <FileQuestion className="w-4 h-4 text-purple-600" />
          Partner FAQs & Policies
        </h2>

        <div className="divide-y divide-gray-100">
          {FAQS.map((faq, idx) => {
            const isOpen = openFaqIndex === idx;
            return (
              <div key={idx} className="py-2.5 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                  className="w-full text-left flex items-center justify-between gap-2 py-1"
                >
                  <span className="text-xs font-bold text-gray-800">{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform ${
                      isOpen ? 'rotate-180 text-purple-600' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="text-xs text-gray-600 mt-2 leading-relaxed bg-purple-50/50 p-3 rounded-xl border border-purple-100">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
