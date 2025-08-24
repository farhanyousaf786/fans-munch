import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { db, auth } from '../config/firebase';
import { User } from '../models/User';

class UserRepository {
  constructor() {
    this.collectionName = 'customers'; // Following stadium_food collection name
  }

  /**
   * Register new user with Firebase Auth and save to Firestore
   * @param {Object} userData - User registration data
   * @returns {Promise<User>}
   */
  async registerUser(userData) {
    try {
      const { email, password, firstName, lastName } = userData;

      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Update Firebase Auth profile
      await updateProfile(firebaseUser, {
        displayName: `${firstName} ${lastName}`
      });

      // Create user document in Firestore customers collection
      const newUser = new User({
        id: firebaseUser.uid,
        email: firebaseUser.email,
        firstName,
        lastName,
        phone: '', // Optional field, can be added later
        fcmToken: '', // Will be updated when FCM token is available
        favoriteFoods: [],
        favoriteRestaurants: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        isActive: true,
        type: 'customer'
      });

      // Save to Firestore with server timestamps (to mirror Flutter Timestamp fields)
      const dataForFirestore = {
        ...newUser.toMap(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, this.collectionName, firebaseUser.uid), dataForFirestore);

      return { success: true, user: newUser };
    } catch (error) {
      console.error('Error registering user:', error);
      
      // Return user-friendly error messages
      if (error.code === 'auth/email-already-in-use') {
        return { success: false, error: 'This email is already registered. Please try signing in instead.' };
      } else if (error.code === 'auth/weak-password') {
        return { success: false, error: 'Password is too weak. Please choose a stronger password (at least 6 characters).' };
      } else if (error.code === 'auth/invalid-email') {
        return { success: false, error: 'Please enter a valid email address.' };
      } else if (error.code === 'auth/operation-not-allowed') {
        return { success: false, error: 'Email/password accounts are not enabled. Please contact support.' };
      } else if (error.code === 'auth/too-many-requests') {
        return { success: false, error: 'Too many failed attempts. Please try again later.' };
      } else {
        return { success: false, error: 'Registration failed. Please try again.' };
      }
    }
  }

  /**
   * Sign in user with email and password
   * @param {string} email 
   * @param {string} password 
   * @returns {Promise<User>}
   */
  async signInUser(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, this.collectionName, firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found. Please contact support.');
      }

      const user = User.fromMap(firebaseUser.uid, userDoc.data());
      
      // Update last active timestamp
      await this.updateLastActive(user.id);

      return user;
    } catch (error) {
      console.error('Error signing in user:', error);
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOutUser() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  /**
   * Get user by ID
   * @param {string} userId 
   * @returns {Promise<User|null>}
   */
  async getUserById(userId) {
    try {
      const userDoc = await getDoc(doc(db, this.collectionName, userId));
      
      if (!userDoc.exists()) {
        return null;
      }

      return User.fromMap(userId, userDoc.data());
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  /**
   * Update user profile
   * @param {string} userId 
   * @param {Object} updates 
   * @returns {Promise<void>}
   */
  async updateUserProfile(userId, updates) {
    try {
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp()
      };

      await updateDoc(doc(db, this.collectionName, userId), updateData);
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  /**
   * Update user's last active timestamp
   * @param {string} userId 
   * @returns {Promise<void>}
   */
  async updateLastActive(userId) {
    try {
      await updateDoc(doc(db, this.collectionName, userId), {
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating last active:', error);
      // Don't throw error for this non-critical operation
    }
  }

  /**
   * Add food to user's favorites
   * @param {string} userId 
   * @param {string} foodId 
   * @returns {Promise<void>}
   */
  async addFavoriteFood(userId, foodId) {
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.addToFavoriteFoods(foodId);
        await updateDoc(doc(db, this.collectionName, userId), {
          favoriteFoods: user.favoriteFoods,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding favorite food:', error);
      throw new Error('Failed to add to favorites. Please try again.');
    }
  }

  /**
   * Remove food from user's favorites
   * @param {string} userId 
   * @param {string} foodId 
   * @returns {Promise<void>}
   */
  async removeFavoriteFood(userId, foodId) {
    try {
      const user = await this.getUserById(userId);
      if (user) {
        user.removeFromFavoriteFoods(foodId);
        await updateDoc(doc(db, this.collectionName, userId), {
          favoriteFoods: user.favoriteFoods,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error removing favorite food:', error);
      throw new Error('Failed to remove from favorites. Please try again.');
    }
  }

  /**
   * Add restaurant to user's favorites
   * @param {string} userId 
   * @param {string} restaurantId 
   * @returns {Promise<void>}
   */
  async addFavoriteRestaurant(userId, restaurantId) {
    try {
      const user = await this.getUserById(userId);
      if (user) {
        // Fix: call the correct method defined in models/User.js
        const updated = user.addFavoriteRestaurant(restaurantId);
        await updateDoc(doc(db, this.collectionName, userId), {
          favoriteRestaurants: updated.favoriteRestaurants,
          updatedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error('Error adding favorite restaurant:', error);
      throw new Error('Failed to add to favorites. Please try again.');
    }
  }

  /**
   * Get user-friendly error messages
   * @param {string} errorCode 
   * @returns {string}
   */
  getErrorMessage(errorCode) {
    const errorMessages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/operation-not-allowed': 'Email/password accounts are not enabled. Please contact support.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/user-not-found': 'No account found with this email address.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please check your credentials.',
      'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.'
    };

    return errorMessages[errorCode] || 'An unexpected error occurred. Please try again.';
  }

  /**
   * Get fallback user data for demo mode
   * @returns {User}
   */
  getFallbackUser() {
    return new User({
      id: 'demo-user',
      email: 'demo@foodmunch.com',
      firstName: 'Demo',
      lastName: 'User',
      phone: '+1 (555) 123-4567',
      fcmToken: '',
      favoriteFoods: [],
      favoriteRestaurants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      type: 'customer'
    });
  }
}

// Export singleton instance
const userRepository = new UserRepository();
export default userRepository;
