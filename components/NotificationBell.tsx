"use client";

import { useState, useEffect } from 'react';
import { Bell, CheckCircle, Info, Gift, AlertTriangle, X } from 'lucide-react';

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bildirimleri Çek
  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setNotifications(data);
        setUnreadCount(data.filter((n) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Her 30 saniyede bir yeni bildirim var mı diye bak
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Kutuyu açınca
  const handleOpen = async () => {
    setIsOpen(!isOpen);
    // Eğer okunmamış mesaj varsa ve kutuyu açıyorsak, hepsini okundu yap
    if (!isOpen && unreadCount > 0) {
      await fetch('/api/notifications', { method: 'PUT' });
      setUnreadCount(0); // Kırmızı noktayı söndür
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); // Listeyi güncelle
    }
  };

  return (
    <div className="relative">
      {/* ZİL BUTONU */}
      <button 
        onClick={handleOpen}
        className="relative p-2 text-slate-400 hover:text-[#00FFFF] transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-red-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full animate-pulse border border-black shadow-lg">
            {unreadCount}
          </span>
        )}
      </button>

      {/* AÇILIR KUTU */}
      {isOpen && (
        <>
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
        
        <div className="absolute right-0 mt-4 w-80 bg-[#0A1120] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-white/5">
          <div className="p-3 bg-black/40 border-b border-white/5 flex justify-between items-center">
            <span className="text-sm font-bold text-white uppercase tracking-wider">Bildirimler</span>
            <span className="text-xs text-gray-500">{notifications.length} mesaj</span>
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm italic">
                Henüz sessizlik hakim... 🦗
              </div>
            ) : (
              notifications.map((note) => (
                <div key={note.id} className={`p-4 border-b border-white/5 flex gap-3 hover:bg-white/5 transition-colors ${!note.isRead ? 'bg-[#00FFFF]/5' : ''}`}>
                  <div className="mt-1 shrink-0">
                    {note.type === 'GIFT' && <Gift size={18} className="text-yellow-400" />}
                    {note.type === 'WARNING' && <AlertTriangle size={18} className="text-red-500" />}
                    {note.type === 'SUCCESS' && <CheckCircle size={18} className="text-green-400" />}
                    {note.type === 'INFO' && <Info size={18} className="text-blue-400" />}
                  </div>
                  
                  <div>
                    <h4 className={`text-sm ${!note.isRead ? 'font-bold text-white' : 'font-medium text-gray-400'}`}>{note.title}</h4>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{note.message}</p>
                    <span className="text-[10px] text-gray-600 mt-2 block">
                        {new Date(note.createdAt).toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
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