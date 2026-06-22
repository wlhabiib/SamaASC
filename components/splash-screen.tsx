'use client';

import { useEffect, useState } from 'react';

export default function SplashScreen() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  if (!showSplash) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020617]">
      <div className="relative">
        {/* Blue frame */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#22D3EE] via-[#3B82F6] to-[#8B5CF6] rounded-3xl blur-xl opacity-50 animate-pulse" />
        <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-3xl overflow-hidden border-4 border-[#22D3EE] shadow-2xl">
          <img 
            src="/image.png" 
            alt="Sama ASC" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
