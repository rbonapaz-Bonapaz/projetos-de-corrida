/**
 * Configuração oficial do Firebase.
 * Sincronizada com o Project ID studio-1669701209-88700.
 */
export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyBTHlgY_B4gElAUJ_d85xcgSThfLWw6iFo",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-1669701209-88700.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-1669701209-88700",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-1669701209-88700.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "654958868324",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:654958868324:web:c9870b2085e8078a286c71",
};
