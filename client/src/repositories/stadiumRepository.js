/**
 * Stadium Repository
 * Handles Firebase Firestore operations for stadium data
 * Based on stadium_food Flutter app repository pattern
 */

import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  where,
  limit 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import Stadium from '../models/Stadium';

class StadiumRepository {
  constructor() {
    this.collectionName = 'stadiums';
    this.stadiumsRef = collection(db, this.collectionName);
  }

  /**
   * Get all stadiums from Firestore
   * @returns {Promise<Stadium[]>}
   */
  async getAllStadiums() {
    try {
      const q = query(
        this.stadiumsRef,
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const stadiums = [];
      
      querySnapshot.forEach((doc) => {
        const stadiumData = { id: doc.id, ...doc.data() };
        stadiums.push(Stadium.fromMap(stadiumData));
      });
      
      return stadiums;
    } catch (error) {
      console.error('Error fetching stadiums:', error);
      
      // Return fallback data if Firebase fails
      return this.getFallbackStadiums();
    }
  }

  /**
   * Get stadium by ID
   * @param {string} stadiumId 
   * @returns {Promise<Stadium|null>}
   */
  async getStadiumById(stadiumId) {
    try {
      const stadiumDoc = doc(db, this.collectionName, stadiumId);
      const docSnap = await getDoc(stadiumDoc);
      
      if (docSnap.exists()) {
        const stadiumData = { id: docSnap.id, ...docSnap.data() };
        return Stadium.fromMap(stadiumData);
      } else {
        console.log('No stadium found with ID:', stadiumId);
        return null;
      }
    } catch (error) {
      console.error('Error fetching stadium by ID:', error);
      return null;
    }
  }

  /**
   * Get stadiums by location/city
   * @param {string} location 
   * @returns {Promise<Stadium[]>}
   */
  async getStadiumsByLocation(location) {
    try {
      const q = query(
        this.stadiumsRef,
        where('location', '==', location),
        orderBy('name', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const stadiums = [];
      
      querySnapshot.forEach((doc) => {
        const stadiumData = { id: doc.id, ...doc.data() };
        stadiums.push(Stadium.fromMap(stadiumData));
      });
      
      return stadiums;
    } catch (error) {
      console.error('Error fetching stadiums by location:', error);
      return [];
    }
  }

  /**
   * Get featured/popular stadiums (limited number)
   * @param {number} limitCount 
   * @returns {Promise<Stadium[]>}
   */
  async getFeaturedStadiums(limitCount = 6) {
    try {
      const q = query(
        this.stadiumsRef,
        orderBy('capacity', 'desc'),
        limit(limitCount)
      );
      
      const querySnapshot = await getDocs(q);
      const stadiums = [];
      
      querySnapshot.forEach((doc) => {
        const stadiumData = { id: doc.id, ...doc.data() };
        stadiums.push(Stadium.fromMap(stadiumData));
      });
      
      return stadiums;
    } catch (error) {
      console.error('Error fetching featured stadiums:', error);
      return this.getFallbackStadiums().slice(0, limitCount);
    }
  }

  /**
   * Search stadiums by name
   * @param {string} searchTerm 
   * @returns {Promise<Stadium[]>}
   */
  async searchStadiums(searchTerm) {
    try {
      // Note: Firestore doesn't support full-text search natively
      // This is a basic implementation - for production, consider using Algolia or similar
      const querySnapshot = await getDocs(this.stadiumsRef);
      const stadiums = [];
      
      querySnapshot.forEach((doc) => {
        const stadiumData = { id: doc.id, ...doc.data() };
        const stadium = Stadium.fromMap(stadiumData);
        
        // Simple search by name (case-insensitive)
        if (stadium.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            stadium.location.toLowerCase().includes(searchTerm.toLowerCase())) {
          stadiums.push(stadium);
        }
      });
      
      return stadiums;
    } catch (error) {
      console.error('Error searching stadiums:', error);
      return [];
    }
  }

  /**
   * Fallback stadium data when Firebase is unavailable
   * @returns {Stadium[]}
   */
  getFallbackStadiums() {
    const fallbackData = [
      {
        id: 'metlife-stadium',
        name: "MetLife Stadium",
        location: "East Rutherford, NJ",
        about: "Home to the New York Giants and New York Jets",
        capacity: 82500,
        imageUrl: "",
        teams: ["Giants", "Jets"],
        color: "#0B2265",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'madison-square-garden',
        name: "Madison Square Garden",
        location: "New York, NY",
        about: "The World's Most Famous Arena",
        capacity: 20789,
        imageUrl: "",
        teams: ["Knicks", "Rangers"],
        color: "#F58426",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'yankee-stadium',
        name: "Yankee Stadium",
        location: "Bronx, NY",
        about: "Home of the New York Yankees",
        capacity: 54251,
        imageUrl: "",
        teams: ["Yankees"],
        color: "#132448",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'barclays-center',
        name: "Barclays Center",
        location: "Brooklyn, NY",
        about: "Home to the Brooklyn Nets and New York Islanders",
        capacity: 17732,
        imageUrl: "",
        teams: ["Nets", "Islanders"],
        color: "#000000",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'citi-field',
        name: "Citi Field",
        location: "Queens, NY",
        about: "Home of the New York Mets",
        capacity: 41922,
        imageUrl: "",
        teams: ["Mets"],
        color: "#002D72",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'red-bull-arena',
        name: "Red Bull Arena",
        location: "Harrison, NJ",
        about: "Home of the New York Red Bulls",
        capacity: 25000,
        imageUrl: "",
        teams: ["Red Bulls"],
        color: "#C4122E",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    return fallbackData.map(data => Stadium.fromMap(data));
  }

  /**
   * Check if Firebase is available and working
   * @returns {Promise<boolean>}
   */
  async isFirebaseAvailable() {
    try {
      // Try to fetch a small amount of data to test connection
      const q = query(this.stadiumsRef, limit(1));
      await getDocs(q);
      return true;
    } catch (error) {
      console.warn('Firebase not available:', error.message);
      return false;
    }
  }
}

// Export singleton instance
const stadiumRepository = new StadiumRepository();
export default stadiumRepository;
