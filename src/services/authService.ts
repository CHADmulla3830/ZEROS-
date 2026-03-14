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
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';

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
      console.error("Firebase Auth Error Details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
        domain: window.location.hostname
      });

      if (error.code === 'auth/unauthorized-domain') {
        const currentDomain = window.location.hostname;
        alert(`Domain Unauthorized!\n\nYour current domain is: ${currentDomain}\n\nTo fix this:\n1. Go to your Firebase Console (link in chat)\n2. Go to Authentication > Settings > Authorized domains\n3. Add "${currentDomain}" to the list.`);
      } else if (error.code === 'auth/popup-blocked') {
        alert('Sign-in popup was blocked by your browser. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/operation-not-allowed') {
        alert('Google Sign-in is not enabled in your Firebase project. Please enable it in Authentication > Sign-in method.');
      } else if (error.code === 'permission-denied') {
        handleFirestoreError(error, OperationType.WRITE, 'users');
      } else {
        alert(`Sign in failed (${error.code}): ${error.message}`);
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
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  },

  async toggleWishlist(uid: string, productId: string): Promise<string[]> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) return [];
      
      const userData = userDoc.data() as UserProfile;
      const currentWishlist = userData.wishlist || [];
      
      let newWishlist: string[];
      if (currentWishlist.includes(productId)) {
        newWishlist = currentWishlist.filter(id => id !== productId);
      } else {
        newWishlist = [...currentWishlist, productId];
      }
      
      await setDoc(userRef, { ...userData, wishlist: newWishlist });
      return newWishlist;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
      return [];
    }
  }
};
