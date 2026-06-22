'use client';

import { Home, Users, Trophy, Image, ScrollText, Heart, Settings } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useTeam } from '@/contexts/team-context';
import { useAuthUser } from '@/lib/auth-context';

const NAV_ITEMS = [
  { icon: Home, label: 'Accueil', path: '/' },
  { icon: Users, label: 'Mon Équipe', path: '/equipe' },
  { icon: Trophy, label: 'Classement', path: '/classement' },
  { icon: Image, label: 'Galerie', path: '/galerie' },
  { icon: ScrollText, label: 'Résultats', path: '/resultats' },
  { icon: Heart, label: 'Supporters', path: '/supporters' },
  { icon: Settings, label: 'Mon Profil', path: '/profil' },
  { icon: Settings, label: 'Admin', path: '/admin', adminOnly: true },
  { icon: Settings, label: 'Paramètres', path: '/parametres', adminOnly: true },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { team } = useTeam();
  const { userRole } = useAuthUser();

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly) {
      return userRole === 'admin';
    }
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-[100] backdrop-blur-xl border-t border-white/10 relative overflow-hidden" style={{ backgroundColor: 'rgba(2, 6, 23, 0.95)' }}>
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#22D3EE]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#8B5CF6]/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-sky-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative flex items-center justify-around py-2 px-2 max-w-lg mx-auto">
        {filteredNavItems.map((item) => {
          const isActive = pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-300 min-w-[44px] ${
                isActive
                  ? 'scale-105'
                  : 'text-white hover:text-white'
              }`}
              style={{
                backgroundColor: isActive ? 'rgba(34, 211, 238, 0.15)' : undefined,
                color: isActive ? '#22D3EE' : undefined,
                boxShadow: isActive ? '0 4px 30px -4px rgba(34, 211, 238, 0.3)' : undefined,
                border: isActive ? '1px solid rgba(34, 211, 238, 0.3)' : undefined,
              }}
            >
              <div className={`relative ${isActive ? 'drop-shadow-sm' : ''}`}>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="transition-all duration-300"
                />
                {isActive && (
                  <div 
                    className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                    style={{ backgroundColor: '#22D3EE' }}
                  />
                )}
              </div>
              <span className={`text-[10px] leading-tight font-medium transition-all duration-300 ${
                isActive ? '' : 'text-white'
              }`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
