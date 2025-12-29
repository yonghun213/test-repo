import type { Metadata } from 'next';
import { Toaster } from 'react-hot-toast';
import Providers from '@/components/Providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Store Launch Ops Platform',
  description: 'BBQ Chicken store launch operations platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">
        <Providers>
          {children}
          <Toaster position="top-right" />
        </Providers>
      </body>
    </html>
  );
}
