'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import DeliveryHeader from '@/components/delivery/DeliveryHeader';
import DeliveryBottomNav from '@/components/delivery/DeliveryBottomNav';

export default function DeliveryLayoutClient({ children }) {
  const { user, isDelivery, isAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const [isOnDuty, setIsOnDuty] = useState(true);

  // Load duty status from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jm_delivery_onduty');
      if (saved !== null) {
        setIsOnDuty(saved === 'true');
      }
    }
  }, []);

  const toggleDuty = () => {
    const next = !isOnDuty;
    setIsOnDuty(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jm_delivery_onduty', String(next));
    }
  };

  // Protect delivery routes
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.replace('/login?redirect=/delivery');
      } else if (!isDelivery && !isAdmin) {
        router.replace('/');
      }
    }
  }, [user, isDelivery, isAdmin, authLoading, router]);

  if (authLoading || (!isDelivery && !isAdmin)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <DeliveryHeader isOnDuty={isOnDuty} onToggleDuty={toggleDuty} />
      <main className="flex-1 pb-20 lg:pb-0">
        {typeof children === 'function'
          ? children({ isOnDuty, toggleDuty })
          : children}
      </main>
      <DeliveryBottomNav />
    </div>
  );
}
