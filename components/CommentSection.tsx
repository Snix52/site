"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";
import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

// Yorumun veri tipi (TypeScript için)
interface Comment {
  id: string;
  content: string;
  username: string;
  userImage: string;
  createdAt: string;
}

export default function CommentSection({ guideId }: { guideId: string }) {
  const { user } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // 1. Yorumları Getir
  useEffect(() => {
    async function fetchComments() {
      try {
        const res = await fetch(`/api/comments?guideId=${guideId}`);
        if (res.ok) {
          const data = await res.json();
          setComments(data);
        }
      } catch (error) {
        console.error("Yorumlar yüklenemedi", error);
      } finally {
        setLoading(false);
      }
    }
    fetchComments();
  }, [guideId]);

  // 2. Yorum Gönder
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment, guideId }),
      });

      if (res.ok) {
        const savedComment = await res.json();
        // Yeni yorumu listeye ekle (sayfayı yenilemeden)
        setComments([savedComment, ...comments]);
        setNewComment(""); // Kutuyu temizle
      }
    } catch (error) {
      console.error("Yorum gönderilemedi", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#0A1120] border border-white/5 rounded-2xl p-6 md:p-8 mt-12 shadow-2xl">
      <h3 className="text-2xl font-black text-white mb-8 flex items-center gap-3">
        TARTIŞMA <span className="text-sm font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-full">{comments.length} Yorum</span>
      </h3>

      {/* --- YORUM YAZMA ALANI --- */}
      <div className="mb-10">
        <SignedIn>
          <form onSubmit={handleSubmit} className="flex gap-4 items-start">
            <img 
              src={user?.imageUrl} 
              alt={user?.fullName || "User"} 
              className="w-10 h-10 rounded-full border-2 border-[#00FFFF]/30 shadow-[0_0_10px_rgba(0,255,255,0.2)]"
            />
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Bu build hakkında ne düşünüyorsun? Fikrini paylaş..."
                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-slate-300 focus:outline-none focus:border-[#00FFFF] focus:ring-1 focus:ring-[#00FFFF] transition-all min-h-[100px] resize-y placeholder:text-slate-600"
              />
              <div className="flex justify-end mt-3">
                <button 
                  disabled={submitting || !newComment.trim()}
                  type="submit"
                  className="bg-[#00FFFF] text-black font-bold py-2 px-6 rounded-lg hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider text-xs"
                >
                  {submitting ? "Gönderiliyor..." : "Yorumu Gönder"}
                </button>
              </div>
            </div>
          </form>
        </SignedIn>

        <SignedOut>
          <div className="bg-black/30 border border-dashed border-slate-700 rounded-xl p-8 text-center">
            <p className="text-slate-400 mb-4">Bu strateji hakkında fikrini belirtmek için giriş yapmalısın.</p>
             <Link href="/sign-in">
                <button className="px-6 py-3 border border-[#00FFFF] text-[#00FFFF] font-bold uppercase tracking-widest rounded hover:bg-[#00FFFF] hover:text-black transition-all shadow-[0_0_15px_rgba(0,255,255,0.2)]">
                  Giriş Yap ve Tartış
                </button>
             </Link>
          </div>
        </SignedOut>
      </div>

      {/* --- YORUM LİSTESİ --- */}
      <div className="space-y-6">
        {loading ? (
          <div className="text-center text-slate-500 py-10 animate-pulse">Yorumlar yükleniyor...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-600 text-lg">Henüz yorum yok. İlk yorumu sen yaz! 👑</p>
          </div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <img 
                src={comment.userImage} 
                alt={comment.username} 
                className="w-10 h-10 rounded-full border border-white/10 group-hover:border-[#00FFFF]/50 transition-colors"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-white font-bold text-sm group-hover:text-[#00FFFF] transition-colors">{comment.username}</span>
                  <span className="text-xs text-slate-600">• {new Date(comment.createdAt).toLocaleDateString('tr-TR')}</span>
                </div>
                <p className="text-slate-400 text-sm leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}