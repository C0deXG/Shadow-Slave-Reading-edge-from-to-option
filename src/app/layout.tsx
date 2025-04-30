// src/app/layout.tsx
import './globals.css';
import { metadata } from './metadata';

export { metadata };

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: '0%' }} />
        </div>
        <main className="reading-container">
          {children}
        </main>
      </body>
    </html>
  );
}