
import type {Metadata, Viewport} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { TrainingProvider } from '@/contexts/TrainingContext';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-headline',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CorreJunto - Laboratório de Performance',
  description: 'Sincronização cloud de treinos e biomecânica.',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CorreJunto Lab',
  },
};

export const viewport: Viewport = {
  themeColor: '#4ade80',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${spaceGrotesk.variable} dark`} suppressHydrationWarning>
      <body className="font-body antialiased bg-background text-foreground">
        <FirebaseClientProvider>
          <TrainingProvider>
            <FirebaseErrorListener />
            {children}
            <Toaster />
          </TrainingProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
