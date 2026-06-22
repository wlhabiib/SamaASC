'use client';

import Header from '@/components/header';
import BottomNav from '@/components/bottom-nav';
import ThemeColorProvider from '@/components/theme-color-provider';
import { useTeam } from '@/contexts/team-context';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { team } = useTeam();

  return (
    <div 
      className="h-screen relative overflow-hidden flex flex-col"
      style={{
        background: 'linear-gradient(135deg, #020617 0%, #071A3D 50%, #2D0A5B 100%)'
      }}
    >
      <ThemeColorProvider />
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      </div>
      <Header />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pt-16 pb-20 px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
