import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Tailor Master — Made to Measure',
  description:
    'Made-to-measure and customizable clothing, with style preview, custom measurements, and workshop-grade fit.',
  manifest: '/manifest.webmanifest',
  applicationName: 'Tailor Master',
};

export const viewport: Viewport = {
  themeColor: '#2b3a67',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <body className="min-h-screen flex flex-col">
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
