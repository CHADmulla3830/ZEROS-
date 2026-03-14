import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserProfile } from '../types';

const googleProvider = new GoogleAuthProvider();

export const AuthService = {
  async signInWithGoogle(): Promise<UserProfile | null> {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        const newUser: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || '',
          photoURL: user.photoURL || '',
          role: user.email === 'chadmulla7@gmail.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        return newUser;
      }
      return userDoc.data() as UserProfile;
    } catch (error: any) {
      console.error("Error signing in with Google", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert('This domain is not authorized in Firebase. Please add your Vercel domain to the "Authorized domains" list in the Firebase Console (Authentication > Settings).');
      } else {
        alert('Sign in failed: ' + (error.message || 'Unknown error'));
      }
      return null;
    }
  },

  async logout() {
    await signOut(auth);
  },

  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const docSnap = await getDoc(doc(db, 'users', uid));
    return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
  }
};
