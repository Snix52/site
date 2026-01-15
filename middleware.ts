import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// Rehber rotalarını korumalı listeden çıkardık (boş bıraktık)
const isProtectedRoute = createRouteMatcher([]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const client = await auth();
    // Eğer ilerde tekrar açarsan burası çalışacak
    if (!client.userId) {
       return client.redirectToSignIn();
    }
  }
  // Giriş yapmasa bile herkes devam edebilecek
  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};