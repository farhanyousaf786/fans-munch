import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

class AuthService {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  // Initialize auth state listener
  init() {
    onAuthStateChanged(auth, (user) => {
      this.currentUser = user;
      this.authStateListeners.forEach(callback => callback(user));
    });
  }

  // Subscribe to auth state changes
  onAuthStateChange(callback) {
    this.authStateListeners.push(callback);
    return () => {
      this.authStateListeners = this.authStateListeners.filter(cb => cb !== callback);
    };
  }

  // Register new user
  async register(email, password, displayName, phoneNumber = '') {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile
      await updateProfile(user, {
        displayName: displayName
      });

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: displayName,
        phoneNumber: phoneNumber,
        createdAt: new Date().toISOString(),
        isActive: true,
        role: 'customer',
        fcmToken: null
      });

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign in user
  async signIn(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName
        }
      };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Sign out user
  async signOut() {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Get user profile from Firestore
  async getUserProfile(uid) {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return {
          success: true,
          user: userDoc.data()
        };
      } else {
        return {
          success: false,
          error: 'User not found'
        };
      }
    } catch (error) {
      console.error('Get user profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Update user profile
  async updateUserProfile(uid, updates) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        ...updates,
        updatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Save FCM token
  async saveFCMToken(uid, fcmToken) {
    try {
      await updateDoc(doc(db, 'users', uid), {
        fcmToken: fcmToken,
        tokenUpdatedAt: new Date().toISOString()
      });

      return { success: true };
    } catch (error) {
      console.error('Save FCM token error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Reset password
  async resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Get ID token for API calls
  async getIdToken() {
    try {
      if (this.currentUser) {
        return await this.currentUser.getIdToken();
      }
      return null;
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  }
}

export default new AuthService();
