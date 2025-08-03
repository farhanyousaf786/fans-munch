import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import Food from '../models/Food';

class FoodRepository {
  constructor() {
    this.collectionName = 'menuItems';
  }

  // Get menu items by stadium ID (matching Flutter app exactly)
  async getStadiumMenu(stadiumId, limitCount = 10) {
    try {
      console.log('Fetching menu for stadium:', stadiumId);
      
      // Query menuItems collection directly, filtering by stadiumId (same as Flutter app)
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(
        menuItemsRef,
        where('stadiumId', '==', stadiumId),
        limit(limitCount)
      );
      
      const menuSnapshot = await getDocs(q);
      console.log('Found menu items:', menuSnapshot.size);
      
      const allMenuItems = [];
      menuSnapshot.forEach((doc) => {
        try {
          console.log('Processing document:', doc.id);
          const data = doc.data();
          console.log('Document data:', data);
          allMenuItems.push(Food.fromMap(doc.id, data));
        } catch (error) {
          console.error('Error processing document', doc.id, ':', error);
        }
      });
      
      // Sort by creation date (same as Flutter app)
      allMenuItems.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bTime - aTime;
      });
      
      console.log('Returning', allMenuItems.length, 'menu items');
      return { success: true, foods: allMenuItems };
    } catch (error) {
      console.error('Error fetching stadium menu:', error);
      return { success: false, error: 'Failed to fetch menu items' };
    }
  }

  // Get all menu items (fallback)
  async getAllMenuItems() {
    try {
      // This is a simplified version - in real app, you'd query across all stadiums
      const menuItems = this.getMockMenuItems();
      return { success: true, foods: menuItems };
    } catch (error) {
      console.error('Error fetching all menu items:', error);
      return { success: false, error: 'Failed to fetch menu items' };
    }
  }

  // Get menu items by category
  async getMenuItemsByCategory(category, stadiumId = null) {
    try {
      let menuItems = this.getMockMenuItems();
      
      if (category !== 'all') {
        menuItems = menuItems.filter(item => 
          item.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      if (stadiumId) {
        menuItems = menuItems.filter(item => item.stadiumId === stadiumId);
      }
      
      return { success: true, foods: menuItems };
    } catch (error) {
      console.error('Error fetching menu items by category:', error);
      return { success: false, error: 'Failed to fetch menu items' };
    }
  }

  // Search menu items
  async searchMenuItems(searchQuery, stadiumId = null) {
    try {
      let menuItems = this.getMockMenuItems();
      
      const searchLower = searchQuery.toLowerCase();
      menuItems = menuItems.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        item.description.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower)
      );
      
      if (stadiumId) {
        menuItems = menuItems.filter(item => item.stadiumId === stadiumId);
      }
      
      return { success: true, foods: menuItems };
    } catch (error) {
      console.error('Error searching menu items:', error);
      return { success: false, error: 'Failed to search menu items' };
    }
  }


}

export default new FoodRepository();
