import { collection, doc, setDoc, getDocs, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { userStorage } from './storage';

const ANONYMOUS_USERS_COLLECTION = 'anonymous_users';

/**
 * Creates an anonymous user account and signs them in
 * @returns {Promise<Object>} User data object
 */
export const createAnonymousUser = async () => {
  try {
    console.log('🎭 Creating anonymous user...');
    
    // Get the next anonymous user number
    const nextUserNumber = await getNextAnonymousUserNumber();
    const displayName = `FanMunch User ${nextUserNumber}`;
    
    // Create anonymous user data
    const anonymousUserData = {
      displayName,
      isAnonymous: true,
      createdAt: serverTimestamp(),
      email: null,
      phone: null,
      firstName: 'FanMunch',
      lastName: `User ${nextUserNumber}`,
      avatar: null,
      // Add any other fields from your user model
    };
    
    // Save to anonymous_users collection
    const userDocRef = doc(collection(db, ANONYMOUS_USERS_COLLECTION));
    await setDoc(userDocRef, {
      ...anonymousUserData,
      id: userDocRef.id,
    });
    
    // Create user object with ID
    const user = {
      ...anonymousUserData,
      id: userDocRef.id,
    };
    
    // Store in local storage for session management
    userStorage.setUserData(user);
    userStorage.setUserToken(user.id); // Set user ID as token for anonymous users
    
    console.log('✅ Anonymous user created successfully:', user);
    return user;
    
  } catch (error) {
    console.error('❌ Failed to create anonymous user:', error);
    throw new Error('Failed to create guest account');
  }
};

/**
 * Gets the next available anonymous user number
 * @returns {Promise<number>} Next user number
 */
const getNextAnonymousUserNumber = async () => {
  try {
    // Get all anonymous users ordered by creation time
    const q = query(
      collection(db, ANONYMOUS_USERS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return 1; // First anonymous user
    }
    
    const lastUser = querySnapshot.docs[0].data();
    const lastUserNumber = extractUserNumber(lastUser.displayName);
    
    return lastUserNumber + 1;
    
  } catch (error) {
    console.warn('⚠️ Could not get next user number, defaulting to 1:', error);
    return 1;
  }
};

/**
 * Extracts user number from display name like "FanMunch User 5"
 * @param {string} displayName 
 * @returns {number}
 */
const extractUserNumber = (displayName) => {
  const match = displayName.match(/FanMunch User (\d+)/);
  return match ? parseInt(match[1], 10) : 0;
};

/**
 * Checks if current user is anonymous
 * @returns {boolean}
 */
export const isCurrentUserAnonymous = () => {
  try {
    const user = userStorage.getUserData();
    return user?.isAnonymous === true;
  } catch (error) {
    return false;
  }
};

/**
 * Gets current anonymous user data
 * @returns {Object|null}
 */
export const getCurrentAnonymousUser = () => {
  try {
    const user = userStorage.getUserData();
    return user?.isAnonymous === true ? user : null;
  } catch (error) {
    return null;
  }
};
