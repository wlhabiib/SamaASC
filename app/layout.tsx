import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { TeamProvider } from '@/contexts/team-context';
import { UserProvider } from '@/lib/auth-context';
import SplashScreen from '@/components/splash-screen';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Sama ASC',
  description: "Plateforme de gestion de l'équipe de football Sama ASC",
  manifest: '/manifest.json',
  icons: {
    icon: '/icon-192.png',
    apple: '/icon-512.png',
  },
  themeColor: '#22D3EE',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Sama ASC',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <SplashScreen />
        <UserProvider>
          <TeamProvider>{children}</TeamProvider>
        </UserProvider>
      </body>
    </html>
  );
}
