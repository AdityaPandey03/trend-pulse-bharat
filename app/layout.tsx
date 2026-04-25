import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ShareChat Trends · आज क्या चल रहा है',
  description: 'भारत में इस वक्त क्या ट्रेंड कर रहा है — ShareChat के लिए बनाया गया।',
  applicationName: 'ShareChat Trends',
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0F0B1F',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="hi" className="dark">
      <head>
        {/* Preload Hindi font for instant render on first paint */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        {/* Mobile container — desktop viewers see phone frame for context */}
        <div className="min-h-screen flex items-start justify-center">
          <main className="w-full max-w-md min-h-screen relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
