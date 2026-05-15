import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'feeddiary',
  description: 'See what your week of saved videos looks like.',
  openGraph: {
    title: 'feeddiary',
    description: 'See what your week of saved videos looks like.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
