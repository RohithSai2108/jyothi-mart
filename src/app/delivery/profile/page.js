'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  User,
  Phone,
  Bike,
  MapPin,
  Camera,
  Save,
  CheckCircle,
  IdCard,
  Truck,
} from 'lucide-react';

export default function DeliveryProfilePage() {
  const { user } = useAuth();

  const [profile, setProfile] = useState({
    name: '',
    phone: '',
    vehicleType: 'bike',
    vehicleNumber: '',
    licenseNumber: '',
    address: '',
    emergencyContact: '',
    photo: null,
  });

  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load profile from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedProfile = localStorage.getItem('jm_delivery_profile');
      if (savedProfile) {
        try {
          setProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
        } catch {}
      } else {
        setProfile((prev) => ({
          ...prev,
          name: user?.name || '',
          phone: user?.phone || '',
        }));
      }
    }
  }, [user]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      localStorage.setItem('jm_delivery_profile', JSON.stringify(profile));
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, photo: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const vehicleOptions = [
    { id: 'bike', label: 'Bike', icon: '🏍️' },
    { id: 'bicycle', label: 'Bicycle', icon: '🚲' },
    { id: 'scooter', label: 'Scooter', icon: '🛵' },
    { id: 'car', label: 'Car', icon: '🚗' },
  ];

  return (
    <div className="p-4 max-w-2xl mx-auto space-y-5">
      {/* Page Title */}
      <div>
        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
          <User className="w-5 h-5 text-purple-600" />
          My Profile
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">Manage your delivery partner account details</p>
      </div>

      {/* Profile Photo */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
        <div className="flex items-center gap-4">
          <label className="relative cursor-pointer group">
            <div className="w-20 h-20 rounded-full bg-purple-100 flex items-center justify-center overflow-hidden border-2 border-purple-200 group-hover:border-purple-400 transition">
              {profile.photo ? (
                <img src={profile.photo} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-black text-purple-400">
                  {profile.name?.charAt(0)?.toUpperCase() || '🚴'}
                </span>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-1.5 rounded-full shadow-md group-hover:bg-purple-700 transition">
              <Camera className="w-3.5 h-3.5" />
            </div>
            <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
          </label>
          <div>
            <p className="text-sm font-bold text-gray-900">{profile.name || 'Delivery Partner'}</p>
            <p className="text-xs text-gray-500">+91 {profile.phone || user?.phone || '—'}</p>
            <p className="text-[10px] text-purple-600 font-bold mt-1 bg-purple-50 px-2 py-0.5 rounded-full inline-block">
              {user?.role === 'admin' ? 'Admin + Driver' : 'Delivery Partner'}
            </p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <IdCard className="w-4 h-4 text-gray-500" />
          Personal Information
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">Full Name</label>
            <div className="relative">
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                placeholder="Enter your full name"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">Phone Number</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+91 XXXXXXXXXX"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">Home Address</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              <textarea
                value={profile.address}
                onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
                placeholder="Enter your residential address"
                rows={2}
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">Emergency Contact</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={profile.emergencyContact}
                onChange={(e) => setProfile((p) => ({ ...p, emergencyContact: e.target.value }))}
                placeholder="Emergency phone number"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2">
          <Truck className="w-4 h-4 text-gray-500" />
          Vehicle Information
        </h3>

        {/* Vehicle Type Selector */}
        <div>
          <label className="text-[11px] font-bold text-gray-600 mb-2 block">Vehicle Type</label>
          <div className="grid grid-cols-4 gap-2">
            {vehicleOptions.map((v) => (
              <button
                key={v.id}
                onClick={() => setProfile((p) => ({ ...p, vehicleType: v.id }))}
                className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 transition cursor-pointer ${
                  profile.vehicleType === v.id
                    ? 'border-purple-500 bg-purple-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <span className="text-xl">{v.icon}</span>
                <span className="text-[10px] font-bold text-gray-700">{v.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">Vehicle Number</label>
            <div className="relative">
              <Bike className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.vehicleNumber}
                onChange={(e) => setProfile((p) => ({ ...p, vehicleNumber: e.target.value.toUpperCase() }))}
                placeholder="TS 23 AB 1234"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-600 mb-1 block">License Number</label>
            <div className="relative">
              <IdCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={profile.licenseNumber}
                onChange={(e) => setProfile((p) => ({ ...p, licenseNumber: e.target.value.toUpperCase() }))}
                placeholder="DL-XXXXXXXXXXXX"
                className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-500 focus:outline-none uppercase"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full flex items-center justify-center gap-2 py-3 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-2xl transition cursor-pointer active:scale-[0.98] shadow-lg disabled:opacity-60"
      >
        {saving ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
        ) : saved ? (
          <>
            <CheckCircle className="w-4 h-4 text-emerald-300" />
            <span>Profile Saved!</span>
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            <span>Save Profile</span>
          </>
        )}
      </button>
    </div>
  );
}
