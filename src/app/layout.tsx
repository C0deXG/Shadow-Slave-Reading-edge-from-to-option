// src/app/layout.tsx
import './globals.css';
import { Inter } from 'next/font/google';
import ThemeProvider from './components/ThemeProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'ePub Reader',
  description: 'A modern ePub reader with Edge read-aloud support',
  metadataBase: new URL('https://your-site.netlify.app'),
  openGraph: {
    title: 'ePub Reader',
    description: 'A modern ePub reader with Edge read-aloud support',
    type: 'website',
  },
  other: {
    'reader-mode': 'enable',
    'edge-reading': 'enable',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-edge-reading="true">
      <head>
        <meta name="reader-mode" content="enable" />
        <meta name="edge-reading" content="enable" />
        <meta name="edge-read-aloud" content="enable" />
      </head>
      <body className={inter.className} data-edge-readable="true">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}