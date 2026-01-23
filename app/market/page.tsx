import { currentUser } from "@clerk/nextjs/server"; // 👈 DÜZELTME BURADA
import { prisma } from "@/lib/prisma";
import MarketClient from "@/components/MarketClient";
import { redirect } from "next/navigation";

export default async function MarketPage() {
  const clerkUser = await currentUser();
  
  // Kullanıcı giriş yapmamışsa login'e at
  if (!clerkUser) {
    redirect("/sign-in");
  }

  // Veritabanından kullanıcıyı çek
  const user = await prisma.user.findUnique({
    where: { id: clerkUser.id },
  });

  // Eğer Clerk'te var ama veritabanında yoksa (senkronizasyon gecikmesi)
  if (!user) {
    return (
        <div className="min-h-screen bg-[#050A14] flex items-center justify-center text-white">
            <div className="text-center animate-pulse">
                <h2 className="text-xl font-bold text-emerald-400">Profil Yükleniyor...</h2>
                <p className="text-gray-500 text-sm mt-2">Lütfen sayfayı yenile.</p>
            </div>
        </div>
    );
  }

  // Her şey tamsa Market'i aç
  return <MarketClient user={user} />;
}