"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Image from "next/image";
// İkonları senin kütüphaneden çekiyoruz
import { ChevronDown, ChevronUp } from "@/components/Icons";

interface Comment {
  id: string;
  content: string;
  username: string;
  userImage: string;
  createdAt: string;
}

export default function CommentSection({ guideId }: { guideId: string }) {
  const { user, isSignedIn } = useUser();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // YENİ ÖZELLİK: Açılıp kapanmayı kontrol eden state
  const [isOpen, setIsOpen] = useState(false);

  const userAvatar = user?.imageUrl ? user.imageUrl : "/file.svg";

  useEffect(() => {
    const fetchComments = async () => {
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
    };

    fetchComments();
  }, [guideId]);

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
        setNewComment("");
        alert("Yorumun başarıyla gönderildi! 🚀\nYönetici onayından sonra yayınlanacaktır.");
      }
    } catch (error) {
      console.error("Hata", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto mb-12">
      {/* 1. TIKLANABİLİR BAŞLIK (AKORDEON KAPAĞI) */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-6 bg-[#0A1120]/90 border border-white/10 shadow-lg backdrop-blur-md transition-all group hover:border-[#00FFFF]/40 ${isOpen ? 'rounded-t-2xl rounded-b-none border-b-transparent' : 'rounded-2xl'}`}
      >
        <div className="flex items-center gap-4">
           {/* Sol tarafta havalı bir ikon/sayaç kutusu */}
           <div className={`flex items-center justify-center w-12 h-12 rounded-xl transition-colors ${isOpen ? 'bg-[#00FFFF] text-black' : 'bg-white/5 text-gray-400 group-hover:text-white'}`}>
              <span className="font-black text-lg font-brand">{comments.length}</span>
           </div>
           
           <div className="text-left">
              <h3 className={`text-xl font-bold font-brand uppercase tracking-wider transition-colors ${isOpen ? 'text-[#00FFFF]' : 'text-white group-hover:text-gray-200'}`}>
                Vadi Tartışmaları
              </h3>
              <p className="text-xs text-gray-500 uppercase tracking-widest">
                {isOpen ? 'Yorumları Gizle' : 'Yorumları Göster'}
              </p>
           </div>
        </div>
        
        {/* Sağ tarafta ok işareti */}
        <div className={`p-2 rounded-full border border-white/5 transition-all duration-300 ${isOpen ? 'bg-[#00FFFF]/10 text-[#00FFFF] rotate-180' : 'bg-transparent text-gray-500 group-hover:text-white'}`}>
           <ChevronDown className="w-6 h-6" />
        </div>
      </button>

      {/* 2. GİZLİ İÇERİK (SADECE AÇIKSA GÖZÜKÜR) */}
      {isOpen && (
        <div className="p-6 bg-[#0A1120]/90 border border-t-0 border-white/10 rounded-b-2xl shadow-xl animate-fade-in relative">
           
           {/* Üst çizgi efekti */}
           <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-[#00FFFF]/20 to-transparent"></div>

          {/* Yorum Listesi */}
          <div className="space-y-4 mb-8 mt-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00FFFF]"></div>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 bg-white/5 rounded-xl border border-white/5 border-dashed">
                <p className="text-gray-400 text-sm">Henüz onaylanmış yorum yok. Sessizliği boz! 👑</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex gap-4 p-4 bg-[#0f192b] rounded-xl border border-white/5 hover:border-cyan-500/20 transition-all group/comment">
                  <div className="shrink-0">
                    <Image 
                      src={comment.userImage || "/file.svg"} 
                      alt={comment.username} 
                      width={40} 
                      height={40} 
                      className="rounded-full border border-white/10 group-hover/comment:border-[#00FFFF]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-white text-sm font-brand tracking-wide">{comment.username}</span>
                      <span className="text-[10px] text-gray-500">
                        {new Date(comment.createdAt).toLocaleDateString('tr-TR')}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm leading-relaxed">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Yorum Yazma Formu */}
          {isSignedIn ? (
            <form onSubmit={handleSubmit} className="space-y-4 pt-6 border-t border-white/5">
              <div className="flex gap-4 items-start">
                <Image 
                  src={userAvatar} 
                  alt="Profil" 
                  width={36} 
                  height={36} 
                  className="rounded-full border border-[#00FFFF]/30 hidden md:block"
                />
                <div className="flex-1 relative">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Vadiye bir not bırak (Küfür yasak)..."
                    className="w-full bg-[#050A14] border border-white/10 rounded-xl p-4 text-white focus:outline-none focus:border-[#00FFFF]/50 focus:bg-black transition-all min-h-[80px] resize-none text-sm placeholder:text-gray-600"
                    disabled={submitting}
                  />
                  <div className="absolute bottom-3 right-3">
                    <button 
                        type="submit" 
                        disabled={submitting || !newComment.trim()}
                        className="px-4 py-1.5 bg-[#00FFFF] hover:bg-cyan-300 text-black font-bold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs uppercase tracking-wide shadow-[0_0_10px_rgba(0,255,255,0.2)] hover:shadow-[0_0_15px_rgba(0,255,255,0.4)]"
                    >
                        {submitting ? "..." : "Gönder"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          ) : (
            <div className="mt-6 text-center p-6 bg-gradient-to-r from-blue-900/10 to-purple-900/10 rounded-xl border border-white/5">
              <p className="text-gray-400 text-xs mb-3 uppercase tracking-wider">Yorum yapmak için takıma katıl</p>
              <SignInButton mode="modal">
                <button className="px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold rounded-lg transition-colors uppercase tracking-widest text-xs">
                  Giriş Yap
                </button>
              </SignInButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}