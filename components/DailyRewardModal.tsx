"use client";

import { useEffect, useState } from 'react';
import { X, Check, Lock, Gift, Zap, Timer } from 'lucide-react';
import { SnixLogo } from './Icons'; 

interface DailyRewardProps {
  isOpen: boolean;
  onClose: () => void;
  currentStreak: number; 
  lastClaimDate: string | null; 
  onClaim: () => void; 
}

const REWARDS = [
  { day: 1, amount: 10, label: 'Başlangıç' },
  { day: 2, amount: 20, label: 'Isınma' },
  { day: 3, amount: 30, label: 'Tempo' },
  { day: 4, amount: 40, label: 'Grind' },
  { day: 5, amount: 50, label: 'Hardcore' },
  { day: 6, amount: 75, label: 'Master' },
  { day: 7, amount: 150, label: 'EFSANE', special: true },
];

export default function DailyRewardModal({ isOpen, onClose, currentStreak, lastClaimDate, onClaim }: DailyRewardProps) {
  const [isClaiming, setIsClaiming] = useState(false);
  
  // ⚡ YENİ STATE: Tıklanan günü hafızaya alır (Snapshot)
  const [frozenDay, setFrozenDay] = useState<number | null>(null);
  
  const [timeLeft, setTimeLeft] = useState("");

  // 🕒 SAYAÇ MANTIĞI
  useEffect(() => {
    const calculateTime = () => {
      const now = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0); 

      const diff = tomorrow.getTime() - now.getTime();
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);

      setTimeLeft(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    const interval = setInterval(calculateTime, 1000);
    calculateTime();
    return () => clearInterval(interval);
  }, []);

  if (!isOpen) return null;

  const today = new Date().toDateString();
  const realRewardAvailable = lastClaimDate !== today;

  // 1. NORMAL HESAPLAMA (Anlık Veriye Göre)
  let calculatedDay = realRewardAvailable ? currentStreak + 1 : currentStreak;
  
  // Döngü kontrolleri
  if (calculatedDay > 7) calculatedDay = 1;
  if (calculatedDay === 0) calculatedDay = 1;

  // 2. EKRANDA GÖSTERİLECEK GÜN (Donmuş veri mi, canlı veri mi?)
  // Eğer animasyon oynuyorsa (isClaiming) ve dondurulmuş bir gün varsa (frozenDay), onu göster.
  // Yoksa canlı hesaplamayı (calculatedDay) göster.
  const displayDay = (isClaiming && frozenDay) ? frozenDay : calculatedDay;

  const handleClaim = () => {
    if (!realRewardAvailable || isClaiming) return;
    
    // ⚡ SNAPSHOT AL: O anki hedef günü dondur
    setFrozenDay(displayDay);
    setIsClaiming(true);
    
    onClaim();

    // 2 saniye sonra her şeyi serbest bırak
    setTimeout(() => {
      setIsClaiming(false);
      setFrozenDay(null); // Hafızayı temizle, güncel veriyi göster
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center px-4 font-sans">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-4xl bg-[#050A14] border border-[#00FFFF]/20 rounded-2xl p-8 shadow-[0_0_50px_rgba(0,255,255,0.1)] overflow-hidden animate-fade-in-up">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-[#00FFFF] to-transparent opacity-50"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#00FFFF]/5 blur-[80px] rounded-full pointer-events-none"></div>

        <div className="flex justify-between items-start mb-10 relative z-10">
          <div>
            <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
              <Gift className="w-8 h-8 text-[#00FFFF]" />
              GÜNLÜK <span className="text-[#00FFFF]">LOJİSTİK</span>
            </h2>
            
            <div className="flex items-center gap-3 mt-2">
                <p className="text-slate-400 text-sm">Seriyi bozma, büyük ödülü kap.</p>
                <div className="h-6 w-[1px] bg-white/20"></div>
                <div className="flex items-center gap-2 text-[#00FFFF] bg-[#00FFFF]/10 px-3 py-1 rounded border border-[#00FFFF]/30 shadow-[0_0_15px_rgba(0,255,255,0.1)]">
                    <Timer size={18} className="animate-pulse"/>
                    <span className="text-lg font-mono font-black tracking-widest">{timeLeft}</span>
                </div>
            </div>
          </div>

          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* GÜNLER GRID */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-10 relative z-10">
          {REWARDS.map((reward) => {
            
            // ⚡ MANTIK: Artık her şeyi 'displayDay' (Donmuş Gün) üzerinden hesaplıyoruz.
            // Bu sayede prop'lar değişse bile animasyon bitene kadar burası sabit kalıyor.

            // Tamamlanmış:
            // 1. Ödül günü displayDay'den küçükse.
            // 2. VEYA (aynıysa) VE (ödül alınabilir değilse).
            // NOT: 'isClaiming' durumunda 'realRewardAvailable' hala true olabilir ama biz görsel olarak kilitledik.
            // O yüzden 'isClaiming' ise henüz tamamlanmış saymıyoruz (spinner dönecek).
            const isCompleted = reward.day < displayDay || (reward.day === displayDay && !realRewardAvailable && !isClaiming);
            
            // Şu Anki (Aktif):
            // Ödül günü displayDay ise VE (alınabilirse VEYA şu an alınıyorsa)
            const isCurrent = reward.day === displayDay && (realRewardAvailable || isClaiming);
            
            // Kilitli:
            const isLocked = reward.day > displayDay;

            return (
              <div 
                key={reward.day}
                onClick={isCurrent ? handleClaim : undefined}
                className={`relative group flex flex-col items-center justify-between p-4 rounded-xl border transition-all duration-300 min-h-[140px]
                  ${isCurrent 
                    ? 'bg-[#00FFFF]/10 border-[#00FFFF] shadow-[0_0_20px_rgba(0,255,255,0.2)] scale-105 z-10 cursor-pointer' 
                    : isCompleted 
                      ? 'bg-[#0A1120] border-[#00FFFF]/30 opacity-70' 
                      : 'bg-[#050A14] border-white/5 opacity-50'
                  }
                `}
              >
                <span className={`text-xs font-bold uppercase tracking-widest mb-2 
                  ${isCurrent ? 'text-[#00FFFF]' : 'text-slate-500'}`}>
                  {reward.day}. GÜN
                </span>

                <div className="flex-1 flex items-center justify-center">
                  {isCompleted ? (
                    <div className="w-10 h-10 rounded-full bg-[#00FFFF]/20 flex items-center justify-center">
                      <Check className="w-6 h-6 text-[#00FFFF]" />
                    </div>
                  ) : isLocked ? (
                    <Lock className="w-8 h-8 text-slate-700" />
                  ) : (
                    // Eğer claiming modundaysak ve bu kart aktif kartsa DÖNSÜN.
                    <SnixLogo className={`w-12 h-12 text-[#00FFFF] drop-shadow-[0_0_10px_rgba(0,255,255,0.5)] ${isClaiming && isCurrent ? 'animate-spin' : 'animate-bounce'}`} />
                  )}
                </div>

                <div className="mt-3 text-center">
                  <span className={`block text-xl font-black ${isCompleted || isCurrent ? 'text-white' : 'text-slate-600'}`}>
                    +{reward.amount} <span className="text-[10px]">SP</span>
                  </span>
                  {reward.special && (
                     <span className="text-[9px] font-bold text-yellow-400 uppercase tracking-wider block mt-1">Bonus!</span>
                  )}
                </div>

                {isCurrent && (
                  <div className="absolute inset-0 border-2 border-[#00FFFF] rounded-xl animate-pulse pointer-events-none"></div>
                )}
              </div>
            );
          })}
        </div>

        {/* ALT BILGI */}
        <div className="flex items-center justify-between bg-[#0A1120] p-6 rounded-xl border border-white/5 relative z-10">
          <div className="flex items-center gap-4">
             <div className="p-3 bg-[#00FFFF]/10 rounded-lg">
                <Zap className="w-6 h-6 text-[#00FFFF]" />
             </div>
             <div>
                <h4 className="text-white font-bold text-sm uppercase">HEDEF: <span className="text-[#00FFFF] text-lg">{displayDay}. GÜN</span></h4>
                <p className="text-slate-400 text-xs">
                    {(realRewardAvailable || isClaiming)
                        ? (isClaiming ? "Onaylanıyor..." : "Ödülün seni bekliyor, hemen al!") 
                        : "Bugünkü lojistik tamamlandı."}
                </p>
             </div>
          </div>

          {(realRewardAvailable || isClaiming) ? (
            <button 
              onClick={handleClaim}
              disabled={isClaiming}
              className="px-8 py-3 bg-[#00FFFF] hover:bg-white text-black font-black text-xs uppercase tracking-[0.2em] rounded transition-all hover:scale-105 shadow-[0_0_20px_rgba(0,255,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isClaiming ? 'Alınıyor...' : 'ÖDÜLÜ AL'}
            </button>
          ) : (
             <div className="px-8 py-3 bg-white/5 text-[#00FFFF] font-black text-lg uppercase tracking-widest rounded border border-white/10 flex items-center gap-3">
                <Timer size={22} className="animate-pulse" />
                <span className="font-mono">{timeLeft}</span>
             </div>
          )}
        </div>

      </div>
    </div>
  );
}