import { redirect } from "next/navigation";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { CheckCircle, Users, MessageSquare, Trash2, Ban, ShieldCheck, Save, Send, BellRing, Megaphone } from "lucide-react";
import Image from "next/image";

export default async function AdminDashboard() {
  const user = await currentUser();
  const ADMIN_ID = "user_38IQNX84WzWPGgn1wdzcOWogLaN"; // Senin ID'n

  if (!user || user.id !== ADMIN_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 font-bold text-2xl">
        ⛔ YETKİSİZ GİRİŞ
      </div>
    );
  }

  // --- VERİLERİ ÇEK ---
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { comments: true } } }
  });

  const pendingComments = await prisma.comment.findMany({
    where: { isApproved: false },
    include: { user: true },
    orderBy: { createdAt: 'desc' }
  });

  // --- SERVER ACTIONS (İŞLEMLER) ---

  // 1. HERKESE DUYURU YAP (GLOBAL)
  async function sendGlobalNotification(formData: FormData) {
    "use server";
    const title = formData.get("title") as string;
    const message = formData.get("message") as string;
    const type = formData.get("type") as string;

    if(!title || !message) return;

    // Tüm kullanıcıların ID'lerini al
    const allUsers = await prisma.user.findMany({ select: { id: true } });

    // Hepsine tek tek bildirim oluştur
    const notifications = allUsers.map(u => ({
        userId: u.id,
        title,
        message,
        type, // INFO, WARNING, GIFT, SUCCESS
        isRead: false
    }));

    // createMany ile toplu ekleme
    await prisma.notification.createMany({
        data: notifications
    });
    
    redirect("/admin");
  }

  // 2. KİŞİYE ÖZEL MESAJ
  async function sendPrivateNotification(formData: FormData) {
    "use server";
    const targetUserId = formData.get("userId") as string;
    const message = formData.get("message") as string;

    if(!message) return;

    await prisma.notification.create({
        data: {
            userId: targetUserId,
            title: "Yönetici Mesajı",
            message: message,
            type: "INFO"
        }
    });
    redirect("/admin");
  }

  // 3. DİĞER İŞLEMLER (Ban, Puan, Yorum)
  async function toggleBan(formData: FormData) {
    "use server";
    const targetUserId = formData.get("userId") as string;
    const currentStatus = formData.get("currentStatus") === "true";
    await prisma.user.update({ where: { id: targetUserId }, data: { isBanned: !currentStatus } });
    redirect("/admin");
  }

  async function managePoints(formData: FormData) {
    "use server";
    const targetUserId = formData.get("userId") as string;
    const amount = parseInt(formData.get("amount") as string);
    if (isNaN(amount) || amount === 0) return;
    
    await prisma.pointTransaction.create({
      data: { amount, type: 'ADMIN_GIFT', description: 'Yönetici Hediyesi', userId: targetUserId },
    });
    await prisma.user.update({
      where: { id: targetUserId },
      data: { currentPoints: { increment: amount }, totalEarned: amount > 0 ? { increment: amount } : undefined }
    });
    redirect("/admin");
  }

  async function approveComment(formData: FormData) {
    "use server";
    await prisma.comment.update({ where: { id: formData.get("commentId") as string }, data: { isApproved: true } });
    redirect("/admin");
  }

  async function deleteComment(formData: FormData) {
    "use server";
    await prisma.comment.delete({ where: { id: formData.get("commentId") as string } });
    redirect("/admin");
  }

  return (
    <div className="min-h-screen bg-[#050A14] text-slate-200 pt-32 px-6 pb-20 font-sans">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex justify-between items-end mb-10">
            <div>
                <h1 className="text-4xl font-black text-white uppercase tracking-tighter">GOD MODE</h1>
                <p className="text-gray-400">Yönetim Paneli v2.1</p>
            </div>
            <div className="text-right">
                <span className="text-[#00FFFF] font-bold text-xl">{users.length}</span> <span className="text-xs text-gray-500 uppercase tracking-wider">Kullanıcı</span>
            </div>
        </div>

        {/* --- BÖLÜM 1: DUYURU İSTASYONU (BROADCAST) --- */}
        <div className="bg-gradient-to-r from-[#0A1120] to-[#0f192e] border border-white/10 rounded-2xl p-6 mb-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <Megaphone size={120} />
            </div>
            
            <div className="relative z-10">
                <h2 className="text-xl font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                    <BellRing className="text-[#00FFFF]" /> Duyuru İstasyonu
                </h2>
                
                <form action={sendGlobalNotification} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-1 w-full space-y-2">
                        <input type="text" name="title" placeholder="Duyuru Başlığı (Örn: Turnuva Başlıyor!)" className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white focus:border-[#00FFFF] outline-none" required />
                        <input type="text" name="message" placeholder="Mesaj İçeriği..." className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-white focus:border-[#00FFFF] outline-none" required />
                    </div>
                    
                    <div className="w-full md:w-48 space-y-2">
                        <select name="type" className="w-full bg-black/40 border border-white/10 rounded px-4 py-2 text-gray-300 focus:border-[#00FFFF] outline-none">
                            <option value="INFO">Bilgi (Mavi)</option>
                            <option value="GIFT">Hediye (Sarı)</option>
                            <option value="WARNING">Uyarı (Kırmızı)</option>
                            <option value="SUCCESS">Başarı (Yeşil)</option>
                        </select>
                        <button className="w-full bg-[#00FFFF] hover:bg-white text-black font-bold py-2 rounded transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                            HERKESE GÖNDER
                        </button>
                    </div>
                </form>
            </div>
        </div>

        {/* --- BÖLÜM 2: ÜYE YÖNETİMİ --- */}
        <div className="bg-[#0A1120] border border-white/10 rounded-2xl overflow-hidden mb-16">
            <div className="p-6 border-b border-white/5 flex items-center gap-3">
                <Users className="text-[#00FFFF]" />
                <h2 className="text-xl font-bold text-white uppercase tracking-wider">Kullanıcı Listesi</h2>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-400">
                    <thead className="bg-black/20 text-xs uppercase font-bold text-gray-500">
                        <tr>
                            <th className="p-4">Kullanıcı</th>
                            <th className="p-4">Puan</th>
                            <th className="p-4">Durum</th>
                            <th className="p-4">Puan İşlemi</th>
                            <th className="p-4">Özel Mesaj</th>
                            <th className="p-4 text-right">Ban</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((u) => (
                            <tr key={u.id} className={`hover:bg-white/5 transition-colors ${u.isBanned ? 'bg-red-900/10' : ''}`}>
                                {/* KULLANICI */}
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <Image src={u.imageUrl || "/file.svg"} alt="" width={40} height={40} className="rounded-full border border-white/10" />
                                        <div>
                                            <p className={`font-bold ${u.isBanned ? 'text-red-500 line-through' : 'text-white'}`}>
  {u.firstName || u.lastName 
    ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() 
    : (u.username || "Oyuncu")}
</p>
                                            <p className="text-[10px] text-gray-600 font-mono tracking-tighter">ID: {u.id}</p>
                                        </div>
                                    </div>
                                </td>

                                {/* PUAN */}
                                <td className="p-4 font-mono text-[#00FFFF] font-bold text-lg">{u.currentPoints} SP</td>

                                {/* DURUM */}
                                <td className="p-4">
                                    {u.isBanned ? <span className="text-red-500 font-bold text-xs">BANLI</span> : <span className="text-green-500 font-bold text-xs">AKTİF</span>}
                                </td>

                                {/* PUAN EKLE */}
                                <td className="p-4">
                                    <form action={managePoints} className="flex items-center gap-2">
                                        <input type="hidden" name="userId" value={u.id} />
                                        <input type="number" name="amount" placeholder="+/-" className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs" />
                                        <button className="bg-[#00FFFF]/10 text-[#00FFFF] p-1.5 rounded"><Save size={14}/></button>
                                    </form>
                                </td>

                                {/* ÖZEL MESAJ */}
                                <td className="p-4">
                                    <form action={sendPrivateNotification} className="flex items-center gap-2">
                                        <input type="hidden" name="userId" value={u.id} />
                                        <input type="text" name="message" placeholder="Mesaj..." className="w-32 bg-black/40 border border-white/10 rounded px-2 py-1 text-white text-xs" />
                                        <button className="bg-blue-500/10 text-blue-400 p-1.5 rounded hover:bg-blue-500 hover:text-white"><Send size={14}/></button>
                                    </form>
                                </td>

                                {/* BAN */}
                                <td className="p-4 text-right">
                                    {u.id !== ADMIN_ID && (
                                        <form action={toggleBan}>
                                            <input type="hidden" name="userId" value={u.id} />
                                            <input type="hidden" name="currentStatus" value={String(u.isBanned)} />
                                            <button className="text-gray-500 hover:text-red-500 transition-colors"><Ban size={18}/></button>
                                        </form>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* --- BÖLÜM 3: YORUM YÖNETİMİ --- */}
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          🛡️ Onay Bekleyenler <span className="text-sm font-normal text-gray-500 bg-gray-800 px-2 py-1 rounded-full">{pendingComments.length}</span>
        </h2>
        <div className="space-y-4">
          {pendingComments.length === 0 ? (
            <div className="p-10 text-center border border-dashed border-white/10 rounded-2xl text-gray-500">Temiz iş. Onay bekleyen yorum yok.</div>
          ) : (
            pendingComments.map((comment) => (
              <div key={comment.id} className="bg-[#0A1120] border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row gap-6 justify-between group">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-bold text-[#00FFFF]">{comment.user?.username || "İsimsiz"}</span>
                    <span className="text-xs text-gray-500">• {comment.guideId}</span>
                  </div>
                  <p className="text-gray-300 bg-black/30 p-3 rounded-lg border border-white/5">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3">
                  <form action={deleteComment}><input type="hidden" name="commentId" value={comment.id} /><button className="px-4 py-2 bg-red-500/10 text-red-500 rounded-lg font-bold text-sm"><Trash2 size={16} /></button></form>
                  <form action={approveComment}><input type="hidden" name="commentId" value={comment.id} /><button className="px-6 py-2 bg-[#00FFFF] text-black rounded-lg font-bold text-sm"><CheckCircle size={16} /></button></form>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}