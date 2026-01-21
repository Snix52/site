interface SpBadgeProps {
  points: number;
  showAnimation?: boolean;
}

export default function SpBadge({ points, showAnimation = false }: SpBadgeProps) {
  const animationKey = showAnimation ? `anim-trigger-${Date.now()}` : `main-coin`;

  return (
    <div className="flex items-center gap-4 group cursor-pointer">
      
      {/* 3D SAHNESİ */}
      <div className="relative w-6 h-16" style={{ perspective: '1000px' }}>
        
        {/* --- KATMAN 1: ÇERÇEVE --- */}
        <div key={animationKey + '-frame'} className="absolute inset-0 w-full h-full animate-frame-spin" style={{ transformStyle: 'preserve-3d' }}>
             <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                   <linearGradient id="frame-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#E0FFFF" />
                      <stop offset="50%" stopColor="#00FFFF" />
                      <stop offset="100%" stopColor="#0088FF" />
                   </linearGradient>

                   <filter id="inner-glow">
                      <feFlood floodColor="#00FFFF"/>
                      <feComposite in2="SourceAlpha" operator="out"/>
                      <feGaussianBlur stdDeviation="2" result="blur"/>
                      <feComposite operator="atop" in2="SourceGraphic"/>
                   </filter>
                </defs>

                {/* DÖNEN GRUP (20s Yavaş Dönüş) */}
                <g className="origin-center animate-[spin_20s_linear_infinite]">
                    {/* AKAN ÇİZGİLER (YENİ DESEN) */}
                    <circle cx="50" cy="50" r="46" 
                            fill="none" 
                            stroke="url(#frame-gradient)" 
                            strokeWidth="4" 
                            /* YENİ DESEN: 140 dolu, 15 boş. Toplamda 2 büyük parça olur. */
                            strokeDasharray="140 15" 
                            filter="url(#inner-glow)"
                            className="animate-energy-flow" />
                </g>
                
                <circle cx="50" cy="50" r="40" fill="none" stroke="#00FFFF" strokeWidth="0.5" opacity="0.6" />
             </svg>
        </div>

        {/* --- KATMAN 2: SABİT LOGO --- */}
        <div key={animationKey + '-core'} className="absolute inset-0 w-full h-full animate-core-pop">
             <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_20px_rgba(0,255,255,0.6)]">
                <defs>
                   <linearGradient id="crystal-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#FFFFFF" />
                      <stop offset="20%" stopColor="#00FFFF" />
                      <stop offset="100%" stopColor="#00CCFF" />
                   </linearGradient>

                   <pattern id="hex-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                      <path d="M5 0 L10 2.5 V7.5 L5 10 L0 7.5 V2.5 Z" fill="none" stroke="#00FFFF" strokeWidth="0.5" opacity="0.2"/>
                   </pattern>
                </defs>

                <circle cx="50" cy="50" r="40" fill="#050a14" stroke="none" opacity="0.9" />
                <circle cx="50" cy="50" r="40" fill="url(#hex-pattern)" />

                <g transform="translate(14, 17) scale(0.6)">
                    <path d="M85 20 H45 L35 30 V45 L45 50 H75 L85 60 V80 L75 90 H35" 
                          stroke="#00FFFF" strokeWidth="10" strokeLinecap="square" strokeLinejoin="bevel" 
                          fill="none" opacity="0.4" filter="blur(6px)" />

                    <path d="M85 20 H45 L35 30 V45 L45 50 H75 L85 60 V80 L75 90 H35" 
                          stroke="url(#crystal-gradient)" 
                          strokeWidth="6" 
                          strokeLinecap="square" 
                          strokeLinejoin="bevel" 
                          fill="none" 
                          className="drop-shadow-[0_0_2px_#fff]" />
                    
                    <g stroke="#E0FFFF" strokeWidth="1.5" fill="none" opacity="0.9">
                        <path d="M48 28 H82" />
                        <path d="M38 82 H72" />
                        <path d="M35 30 L45 30" />
                        <path d="M50 50 L70 50" />
                    </g>
                </g>
             </svg>
        </div>

      </div>

      {/* YAZI KISMI */}
      <div className="hidden md:flex flex-col justify-center leading-none">
          <span key={points} className="text-white font-black text-2xl tracking-widest drop-shadow-[0_0_10px_rgba(0,255,255,0.8)] font-[family-name:var(--font-rajdhani)] animate-[pulse_0.5s_ease-in-out]">
              {points}
          </span>
          <span className="text-[10px] text-[#00FFFF] font-bold uppercase tracking-[0.3em] border-t border-[#00FFFF]/30 mt-1 pt-0.5 drop-shadow-[0_0_5px_rgba(0,255,255,0.5)]">
              BAKİYE
          </span>
      </div>

    </div>
  );
}