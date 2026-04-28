// TrustNet AI — Auth Context (Firebase)
import { createContext, useContext, useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import { supabase } from '../supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Fetch extended profile from Supabase
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUser.uid)
          .single();
        
        if (prof) setProfile(prof);
        else setProfile(null); // Not set up yet
        
        setUser(currentUser);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    setError('');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(e.message);
    }
  };

  const loginWithEmail = async (email, password) => {
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  const registerWithEmail = async (email, password, displayName) => {
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (displayName) {
        await updateProfile(userCredential.user, { displayName });
      }
      return userCredential.user;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  };

  // Create or Join Company
  const setupProfile = async (uid, email, displayName, role, orgId) => {
    // 1. Ensure organization exists in database to prevent FK constraint error
    if (role === 'owner') {
      await supabase.from('organizations').upsert({
        id: orgId,
        name: orgId.includes('-') ? orgId.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ') : `${orgId.toUpperCase()} Corp`,
        riskScore: 68,
        totalEmployees: 1,
        complianceScore: 92
      });
    }

    // 2. Create the profile
    const status = role === 'owner' ? 'approved' : 'pending';
    const { data, error } = await supabase.from('profiles').upsert({
      id: uid,
      email,
      displayName,
      role,
      orgId,
      status,
      createdAt: new Date().toISOString()
    }).select().single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, error, 
      loginWithGoogle, loginWithEmail, registerWithEmail, setupProfile, logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
