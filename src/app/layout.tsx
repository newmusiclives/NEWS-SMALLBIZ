import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SmallBiz Finder - Discover Service Businesses for Newsletter Outreach',
  description: 'Find small service businesses across regions to offer newsletter services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
