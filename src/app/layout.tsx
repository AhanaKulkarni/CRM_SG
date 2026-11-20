import type { Metadata } from 'next';
import './globals.css';
import { StoreProvider } from '@/lib/store';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'NEXORA CRM · Business Platform',
  description: 'Complete responsive business management platform with leads, customers, tasks, telecalling, GST invoicing and AI.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased selection:bg-brand selection:text-white">
        <StoreProvider>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </StoreProvider>
      </body>
    </html>
  );
}
