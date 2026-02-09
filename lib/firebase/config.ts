"use client"

// Mirrors the approach used in ~/projects/spark/web:
// - Firebase Web SDK config is public and can be hardcoded.
// - authDomain points at the current host so Firebase Auth helper endpoints
//   live under this app domain (proxied via /__/auth/*).

function currentHostAuthDomain(): string {
  if (typeof window !== "undefined") {
    return window.location.host
  }
  // SSR fallback (useEffect code won't run on the server, but keep this stable for builds).
  return "localhost:3000"
}

export const clientFirebaseConfig = {
  apiKey: "AIzaSyDy9h1WEveGy10w_8m6Aa-Bax9mNF2OKuw",
  authDomain: currentHostAuthDomain(),
  projectId: "pic2toon",
  storageBucket: "pic2toon.firebasestorage.app",
  messagingSenderId: "1083072308192",
  appId: "1:1083072308192:web:db604280a19f025e938185",
  measurementId: "G-V068HR5F8T",
} as const
