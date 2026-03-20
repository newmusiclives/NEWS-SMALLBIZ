import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TrueFans SMALLBIZ - Discover Service Businesses for Newsletter Outreach',
  description: 'Find small service businesses across regions to offer newsletter services',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            navigator.serviceWorker.getRegistrations().then(function(registrations) {
              registrations.forEach(function(registration) {
                registration.unregister();
                console.log('Unregistered service worker:', registration.scope);
              });
            });
          }
        `}} />
        {children}
      </body>
    </html>
  );
}
