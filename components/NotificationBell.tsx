"use client";

import { useState, useEffect, useRef } from 'react'; // useRef ekledik
import { Bell, CheckCircle, Info, Gift, AlertTriangle } from 'lucide-react';
import { useUser } from '@clerk/nextjs'; // Kullanıcı kontrolü için

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const { isSignedIn, isLoaded } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // KİLİT MEKANİZMASI: Aynı anda birden fazla istek gitmesini engeller
  const isFetching = useRef(false);
  const lastFetchTime = useRef(0);

  const fetchNotifications = async () => {
    // Eğer zaten bir istek yoldaysa veya son 5 saniye içinde istek atıldıysa DUR
    if (isFetching.current || Date.now() - lastFetchTime.current < 5000) return;
    
    try {
      isFetching.current = true;
      const res = await fetch('/api/notifications');
      if (!res.ok) throw new Error("Bildirimler alınamadı");
      
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
        lastFetchTime.current = Date.now();
      }
    } catch (e) {
      console.error("Bildirim Hatası:", e);
    } finally {
      isFetching.current = false;
    }
  };

  useEffect(() => {
    // Sadece kullanıcı hazır ve giriş yapmışsa çalış
    if (!isLoaded || !isSignedIn) return;

    fetchNotifications();

    // Localde kasmaması için süreyi 30 saniyeden 60 saniyeye çıkardım
    const interval = setInterval(fetchNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [isSignedIn, isLoaded]);

  const handleOpen = async () => {
    setIsOpen(!isOpen);
    if (!isOpen && unreadCount > 0) {
      try {
        // Optimistik güncelleme: UI'ı hemen düzelt, sonra server'a söyle
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        
        await fetch('/api/notifications', { method: 'PUT' });
      } catch (e) {
        console.error("Okundu işaretleme hatası:", e);
      }
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleOpen}
        className="relative p-2 text-slate-400 hover:text-[#00FFFF] transition-all hover:scale-110 active:scale-95"
      >
        <Bell size={22} className={unreadCount > 0 ? "animate-[swing_2s_ease-in-out_infinite]" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[9px] font-black flex items-center justify-center rounded-full border-2 border-[#050A14] shadow-[0_0_10px_rgba(220,38,38,0.5)]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 mt-4 w-80 bg-[#0A1120]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-50 overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-4 bg-white/5 border-b border-white/5 flex justify-between items-center">
              <span className="text-xs font-black text-[#00FFFF] uppercase tracking-[0.2em]">Sistem Mesajları</span>
              <span className="text-[10px] text-gray-500 font-bold bg-white/5 px-2 py-0.5 rounded-full">{notifications.length} Bildirim</span>
            </div>

            <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="p-10 text-center text-gray-600 text-xs font-medium italic">
                  Henüz bir mesajın yok... </div>
              ) : (
                notifications.map((note) => (
                  <div key={note.id} className={`p-4 border-b border-white/5 flex gap-4 hover:bg-white/5 transition-colors ${!note.isRead ? 'bg-[#00FFFF]/5 border-l-2 border-l-[#00FFFF]' : ''}`}>
                    <div className="mt-1 shrink-0 bg-black/20 p-2 rounded-lg">
                      {note.type === 'GIFT' && <Gift size={16} className="text-yellow-400" />}
                      {note.type === 'WARNING' && <AlertTriangle size={16} className="text-red-500" />}
                      {note.type === 'SUCCESS' && <CheckCircle size={16} className="text-green-400" />}
                      {note.type === 'INFO' && <Info size={16} className="text-[#00FFFF]" />}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-sm truncate ${!note.isRead ? 'font-bold text-white' : 'font-medium text-gray-400'}`}>{note.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">{note.message}</p>
                      <span className="text-[9px] text-gray-600 mt-2 font-bold block uppercase">
                        {new Date(note.createdAt).toLocaleDateString('tr-TR')} ⬢ {new Date(note.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
