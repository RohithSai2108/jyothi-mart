'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Clock, IndianRupee, BarChart3, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { icon: Home, label: 'Dashboard', href: '/delivery', exact: true },
  { icon: Clock, label: 'History', href: '/delivery/history' },
  { icon: IndianRupee, label: 'Earnings', href: '/delivery/earnings' },
  { icon: BarChart3, label: 'Stats', href: '/delivery/performance' },
  { icon: User, label: 'Profile', href: '/delivery/profile' },
];

export default function DeliveryBottomNav() {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-40 lg:hidden">
      <div className="flex justify-around items-center h-16">
        {NAV_ITEMS.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);

          return (
            <Link
              key={item.label}
              href={item.href}
              className="flex flex-col items-center justify-center w-full"
            >
              <item.icon
                className={cn(
                  'w-5 h-5 mb-0.5 transition',
                  active ? 'text-purple-600' : 'text-gray-400'
                )}
              />
              <span
                className={cn(
                  'text-[10px] font-semibold transition',
                  active ? 'text-purple-600 font-bold' : 'text-gray-400'
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
