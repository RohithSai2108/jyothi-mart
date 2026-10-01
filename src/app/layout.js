import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { LocationProvider } from '@/context/LocationContext';
import Header from '@/components/layout/Header';
import BottomNav from '@/components/layout/BottomNav';
import CartBar from '@/components/layout/CartBar';
import LoginModal from '@/components/common/LoginModal';

const inter = Inter({ subsets: ['latin'], display: 'swap', preload: true });

export const metadata = {
  title: 'Jyothi Mart - Groceries Delivered in 10 Minutes | Metpally',
  description:
    'Order fresh groceries, dal, rice, oil, vegetables & daily essentials online. Fast 10-minute delivery in Metpally, Jagtial district. Kandipappu, Biyyam, Pasupu — search in Telugu, Hindi or English!',
  keywords:
    'grocery delivery, metpally, telangana, kandipappu, biyyam, online grocery, jyothi mart, fresh groceries, 10 minute delivery',
  manifest: '/manifest.json',
  themeColor: '#0C831F',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Jyothi Mart',
  },
  openGraph: {
    title: 'Jyothi Mart - Groceries in 10 Minutes',
    description: 'Fresh groceries & daily essentials delivered fast in Metpally, Telangana.',
    type: 'website',
    locale: 'te_IN',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#0C831F',
};

export default function RootLayout({ children }) {
  return (
    <html lang="te">
      <body className={inter.className}>
        <AuthProvider>
          <LocationProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen pb-20 lg:pb-0 relative">
                <Header />
                <main className="flex-1 overflow-x-hidden">
                  {children}
                </main>
                <CartBar />
                <BottomNav />
                <LoginModal />
              </div>
            </CartProvider>
          </LocationProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

