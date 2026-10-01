import DeliveryLayoutClient from '@/components/delivery/DeliveryLayoutClient';

export const metadata = {
  title: 'Delivery Portal | Jyothi Mart Partner',
  description: 'Delivery partner order management, routes, earnings, and performance dashboard.',
};

export const viewport = {
  themeColor: '#7C3AED',
};

export default function DeliveryLayout({ children }) {
  return <DeliveryLayoutClient>{children}</DeliveryLayoutClient>;
}
