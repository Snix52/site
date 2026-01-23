import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// 🔒 Korumalı Rotalar (Giriş yapmadan kimse giremesin)
const isProtectedRoute = createRouteMatcher([
  '/market(.*)', // Market ve alt sayfaları
  '/profil(.*)', // Profil ve alt sayfaları
  '/api/market(.*)', // Market API'leri
  '/api/user(.*)',   // Kullanıcı API'leri
  '/admin(.*)'       // Admin paneli (varsa)
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
     await auth.protect(); // Giriş yapmamışsa Login sayfasına fırlatır
  }
});

export const config = {
  matcher: [
    // Next.js statik dosyaları hariç her şeyi koru
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // API rotalarını her zaman koru
    '/(api|trpc)(.*)',
  ],
};