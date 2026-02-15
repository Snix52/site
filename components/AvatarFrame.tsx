import React from 'react';

interface AvatarFrameProps {
  src: string;
  frameType: string;
  className?: string; // YENİ: Dışarıdan boyut alabiliyor
}

// LOCAL DOSYALAR
export const FRAMES: Record<string, string> = {
  DARKIN: "/frames/darkin.png",
  IONIA: "/frames/ionia.png",
  HEXTECH: "/frames/hextech.png",
  BASIC: "/frames/basic.png",
  CHALLENGER: "/frames/challenger.png",
  SHADOW: "/frames/shadow.png",
  VOID: "/frames/void.png",
  FRELJORD: "/frames/freljord.png"
};

// ----------------------------------------------------------------------
//  BEDEN AYARLARI (Yüzdelik olduğu için her boyutta çalışır)
// ----------------------------------------------------------------------
const FRAME_SIZES: Record<string, string> = {
  DARKIN: "70%",
  IONIA: "76%",
  HEXTECH: "77%",
  BASIC: "80%",      
  CHALLENGER: "71%", 
  SHADOW: "68%",
  VOID: "69%",
  FRELJORD: "74%"
};
// ----------------------------------------------------------------------

export default function AvatarFrame({ src, frameType, className = "w-44 h-44" }: AvatarFrameProps) {
  const frameUrl = FRAMES[frameType] || FRAMES["BASIC"];
  const currentSize = FRAME_SIZES[frameType] || "63%";

  const getGroupAnimation = () => {
    switch (frameType) {
      case "DARKIN": return "animate-darkin";
      case "IONIA": return "animate-ionia";
      case "HEXTECH": return "animate-hextech";
      case "SHADOW": return "animate-shadow";
      case "VOID": return "animate-void";
      case "CHALLENGER": return "animate-challenger";
      case "FRELJORD": return ""; 
      default: return "";
    }
  };

  return (
    // DÜZELTME: className dışarıdan geliyor, varsayılanı w-44 h-44
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      
      {/* KATMAN 0: ARKA PLAN EFEKTLERİ (AURA) - ARTIK YÜZDELİK! */}
      <div className="absolute inset-0 flex items-center justify-center z-[-1]">
        
        {/* DARKIN */}
        {frameType === "DARKIN" && (
          <>
            <div className="absolute w-[80%] h-[80%] bg-red-600/40 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute w-[60%] h-[60%] bg-red-900/60 rounded-full blur-xl animate-ping" style={{ animationDuration: '3s' }}></div>
          </>
        )}

        {/* IONIA */}
        {frameType === "IONIA" && (
          <>
            <div className="absolute w-[80%] h-[80%] bg-cyan-400/30 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute w-[70%] h-[70%] bg-pink-500/30 rounded-full blur-3xl animate-[pulse_4s_infinite_1s]"></div>
          </>
        )}

        {/* HEXTECH */}
        {frameType === "HEXTECH" && (
          <>
            <div className="absolute w-[80%] h-[80%] bg-blue-600/40 rounded-full blur-2xl shadow-[0_0_50px_rgba(37,99,235,0.6)]"></div>
            <div className="absolute w-[60%] h-[60%] border-2 border-blue-400/50 rounded-full animate-[ping_2s_linear_infinite]"></div>
          </>
        )}

        {/* SHADOW */}
        {frameType === "SHADOW" && (
            <>
                <div className="w-[80%] h-[80%] bg-emerald-500/30 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-full h-full bg-teal-900/20 blur-xl animate-[spin_10s_linear_infinite]"></div>
            </>
        )}

        {/* VOID */}
        {frameType === "VOID" && (
            <div className="w-[80%] h-[80%] bg-purple-700/50 rounded-full blur-2xl animate-[pulse_2s_infinite]"></div>
        )}

        {/* CHALLENGER */}
        {frameType === "CHALLENGER" && (
            <>
                <div className="absolute w-[80%] h-[80%] bg-blue-600/50 rounded-full blur-2xl animate-pulse"></div>
                <div className="absolute w-[90%] h-[90%] bg-yellow-400/20 rounded-full blur-3xl animate-[spin_6s_linear_infinite]"></div>
            </>
        )}

        {/* FRELJORD */}
        {frameType === "FRELJORD" && (
            <div className="w-[80%] h-[80%] bg-cyan-500/10 rounded-full blur-xl"></div>
        )}
      </div>


      {/* KATMAN 1: GRUP (Resim + Çerçeve) */}
      <div className={`relative w-full h-full flex items-center justify-center ${getGroupAnimation()}`}>
        
        {/* Profil Resmi */}
        <div 
          className="absolute rounded-full overflow-hidden z-0 border border-black/50 shadow-inner transition-all duration-300"
          style={{ width: currentSize, height: currentSize }}
        >
          <img src={src} alt="Avatar" className="w-full h-full object-cover" />
        </div>

        {/* Çerçeve Resmi */}
        <img 
          src={frameUrl} 
          alt="Frame" 
          className="absolute inset-0 w-full h-full object-contain z-10 pointer-events-none drop-shadow-2xl scale-110"
        />
      </div>


      {/* KATMAN 2: ÖN PLAN EFEKTLERİ */}
      <div className="absolute inset-0 z-20 pointer-events-none rounded-full overflow-hidden">
         {frameType === "HEXTECH" && <div className="absolute inset-0 bg-blue-400/10 mix-blend-overlay animate-pulse"></div>}
         {frameType === "DARKIN" && <div className="absolute inset-0 bg-red-500/10 mix-blend-overlay animate-pulse"></div>}
         {frameType === "SHADOW" && <div className="absolute inset-0 bg-emerald-900/20 mix-blend-overlay animate-pulse"></div>}
         {frameType === "VOID" && <div className="absolute inset-0 bg-fuchsia-900/20 mix-blend-overlay animate-pulse"></div>}
         {frameType === "CHALLENGER" && <div className="absolute inset-0 bg-cyan-300/10 mix-blend-overlay animate-pulse"></div>}
      </div>


      {/* CSS KEYFRAMES */}
      <style jsx global>{`
        /* Darkin */
        .animate-darkin { animation: darkinMove 4s ease-in-out infinite; }
        @keyframes darkinMove {
          0%, 100% { transform: scale(1); filter: brightness(1); }
          50% { transform: scale(1.03); filter: brightness(1.3) drop-shadow(0 0 10px rgba(220, 38, 38, 0.5)); }
        }

        /* Ionia */
        .animate-ionia { animation: ioniaMove 6s ease-in-out infinite; }
        @keyframes ioniaMove {
          0%, 100% { transform: translateY(0); filter: hue-rotate(0deg); }
          50% { transform: translateY(-4px); filter: hue-rotate(10deg); }
        }

        /* Hextech */
        .animate-hextech { animation: hextechMove 1s steps(2) infinite alternate; } 
        @keyframes hextechMove {
           from { transform: scale(1); filter: brightness(1); }
           to { transform: scale(1.01); filter: brightness(1.2) drop-shadow(0 0 5px rgba(59,130,246,0.8)); }
        }

        /* Shadow */
        .animate-shadow { animation: shadowFloat 5s ease-in-out infinite; }
        @keyframes shadowFloat {
            0%, 100% { transform: translateY(0) scale(1); opacity: 0.9; }
            50% { transform: translateY(-3px) scale(1.02); opacity: 1; filter: drop-shadow(0 0 10px #10b981); }
        }

        /* Void */
        .animate-void { animation: voidPulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes voidPulse {
            0%, 100% { transform: scale(1); filter: hue-rotate(0deg); }
            50% { transform: scale(1.04); filter: hue-rotate(20deg) brightness(1.1); }
        }

        /* Challenger Animation */
        .animate-challenger { animation: challengerGlow 3s ease-in-out infinite; }
        @keyframes challengerGlow {
            0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(37,99,235,0.6)); }
            50% { transform: scale(1.02); filter: drop-shadow(0 0 20px rgba(6,182,212,0.9)) brightness(1.2); }
        }
      `}</style>
    </div>
  );
}
