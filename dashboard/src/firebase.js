// TrustNet AI — Firebase Configuration
// ✅ All values read from dashboard/.env (via import.meta.env)
// ⚠️  Never hardcode keys here — add them to .env instead

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that keys are loaded (fails loudly in dev if .env is missing)
if (!firebaseConfig.apiKey) {
  console.error(
    '[TrustNet] Firebase API key missing!\n' +
    'Create dashboard/.env and add VITE_FIREBASE_API_KEY=...'
  );
}

export const app           = initializeApp(firebaseConfig);
export const db            = getFirestore(app);
export const auth          = getAuth(app);
export const rtdb          = getDatabase(app);
export const analytics     = getAnalytics(app);
export const googleProvider = new GoogleAuthProvider();

// Org ID — change per deployment
export const ORG_ID = 'apex-financial';
