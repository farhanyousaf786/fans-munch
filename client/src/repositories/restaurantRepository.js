import { collection, getDocs, doc, getDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';
import Restaurant from '../models/Restaurant';

class RestaurantRepository {
  constructor() {
    this.collectionName = 'restaurants';
  }

  // Get all restaurants
  async getAllRestaurants() {
    try {
      const restaurantsRef = collection(db, this.collectionName);
      const q = query(restaurantsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const restaurants = [];
      querySnapshot.forEach((doc) => {
        const restaurant = Restaurant.fromMap(doc.data(), doc.id);
        restaurants.push(restaurant);
      });
      
      return { success: true, restaurants };
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      return { success: false, error: 'Failed to fetch restaurants' };
    }
  }

  // Get restaurants by stadium
  async getRestaurantsByStadium(stadiumId) {
    try {
      const restaurantsRef = collection(db, this.collectionName);
      const q = query(
        restaurantsRef, 
        where('stadiumId', '==', stadiumId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const restaurants = [];
      querySnapshot.forEach((doc) => {
        const restaurant = Restaurant.fromMap(doc.data(), doc.id);
        restaurants.push(restaurant);
      });
      
      return { success: true, restaurants };
    } catch (error) {
      console.error('Error fetching restaurants by stadium:', error);
      return { success: false, error: 'Failed to fetch restaurants' };
    }
  }

  // Get restaurant by ID
  async getRestaurantById(restaurantId) {
    try {
      const restaurantRef = doc(db, this.collectionName, restaurantId);
      const docSnap = await getDoc(restaurantRef);
      
      if (docSnap.exists()) {
        const restaurant = Restaurant.fromMap(docSnap.data(), docSnap.id);
        return { success: true, restaurant };
      } else {
        return { success: false, error: 'Restaurant not found' };
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      return { success: false, error: 'Failed to fetch restaurant' };
    }
  }

  // Get open restaurants only
  async getOpenRestaurants() {
    try {
      const restaurantsRef = collection(db, this.collectionName);
      const q = query(
        restaurantsRef, 
        where('isOpen', '==', true),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      const restaurants = [];
      querySnapshot.forEach((doc) => {
        const restaurant = Restaurant.fromMap(doc.data(), doc.id);
        restaurants.push(restaurant);
      });
      
      return { success: true, restaurants };
    } catch (error) {
      console.error('Error fetching open restaurants:', error);
      return { success: false, error: 'Failed to fetch open restaurants' };
    }
  }

  // Search restaurants by name or cuisine
  async searchRestaurants(searchQuery) {
    try {
      const restaurantsRef = collection(db, this.collectionName);
      const querySnapshot = await getDocs(restaurantsRef);
      
      const restaurants = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const restaurant = Restaurant.fromMap(data, doc.id);
        
        // Simple text search (in production, use Algolia or similar)
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = restaurant.name.toLowerCase().includes(searchLower);
        const cuisineMatch = restaurant.cuisine.some(c => 
          c.toLowerCase().includes(searchLower)
        );
        const descriptionMatch = restaurant.description.toLowerCase().includes(searchLower);
        
        if (nameMatch || cuisineMatch || descriptionMatch) {
          restaurants.push(restaurant);
        }
      });
      
      return { success: true, restaurants };
    } catch (error) {
      console.error('Error searching restaurants:', error);
      return { success: false, error: 'Failed to search restaurants' };
    }
  }
}

export default new RestaurantRepository();
