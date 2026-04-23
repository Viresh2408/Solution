// TrustNet AI — Auth Context (Google Sign-In + Email/Password)
import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithPopup, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    setError('');
    try { await signInWithPopup(auth, googleProvider); }
    catch (e) { setError(e.message); }
  };

  const loginWithEmail = async (email, password) => {
    setError('');
    try { await signInWithEmailAndPassword(auth, email, password); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const registerWithEmail = async (email, password) => {
    setError('');
    try { await createUserWithEmailAndPassword(auth, email, password); }
    catch (e) { setError(friendlyError(e.code)); throw e; }
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, loading, error, loginWithGoogle, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

function friendlyError(code) {
  const map = {
    'auth/user-not-found':      'No account found with this email.',
    'auth/wrong-password':      'Incorrect password.',
    'auth/email-already-in-use':'An account with this email already exists.',
    'auth/invalid-email':       'Please enter a valid email address.',
    'auth/weak-password':       'Password must be at least 6 characters.',
    'auth/too-many-requests':   'Too many attempts. Try again later.',
    'auth/popup-closed-by-user':'Sign-in popup was closed.',
  };
  return map[code] || 'Authentication failed. Please try again.';
}
