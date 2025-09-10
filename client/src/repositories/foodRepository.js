import { collection, getDocs, doc, getDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';
import Food from '../models/Food';

class FoodRepository {
  constructor() {
    this.collectionName = 'menuItems';
  }

  // Get menu items by shop ID (menuItems.shopIds contains shopId)
  async getMenuItemsByShop(shopId, limitCount = 30) {
    try {
      if (!shopId) {
        return { success: false, error: 'Invalid shopId' };
      }
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(
        menuItemsRef,
        where('shopIds', 'array-contains', shopId),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const items = [];
      snap.forEach((d) => {
        try {
          items.push(Food.fromMap(d.id, d.data()));
        } catch (e) {
          console.error('Error mapping food', d.id, e);
        }
      });
      return { success: true, foods: items };
    } catch (error) {
      console.error('Error fetching shop menu:', error);
      return { success: false, error: 'Failed to fetch shop menu' };
    }
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
      // Query all menu items without stadium filter
      const menuItemsRef = collection(db, 'menuItems');
      const q = query(menuItemsRef, limit(50));
      
      const menuSnapshot = await getDocs(q);
      console.log('Found all menu items:', menuSnapshot.size);
      
      const allMenuItems = [];
      menuSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          allMenuItems.push(Food.fromMap(doc.id, data));
        } catch (error) {
          console.error('Error processing document', doc.id, ':', error);
        }
      });
      
      return { success: true, foods: allMenuItems };
    } catch (error) {
      console.error('Error fetching all menu items:', error);
      return { success: false, error: 'Failed to fetch menu items' };
    }
  }

  // Get menu items by category
  async getMenuItemsByCategory(category, stadiumId = null) {
    try {
      // First get all menu items for the stadium
      let result;
      if (stadiumId) {
        result = await this.getStadiumMenu(stadiumId, 50);
      } else {
        result = await this.getAllMenuItems();
      }
      
      if (!result.success) {
        return result;
      }
      
      let menuItems = result.foods;
      
      // Filter by category if not 'all'
      if (category !== 'all') {
        menuItems = menuItems.filter(item => {
          // Check if item has category field that matches
          return item.category === category || 
                 (item.categoryMap && item.categoryMap[category]) ||
                 (typeof item.category === 'string' && item.category.toLowerCase() === category.toLowerCase());
        });
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
      // First get all menu items for the stadium
      let result;
      if (stadiumId) {
        result = await this.getStadiumMenu(stadiumId, 50);
      } else {
        result = await this.getAllMenuItems();
      }
      
      if (!result.success) {
        return result;
      }
      
      let menuItems = result.foods;
      
      // Filter by search query
      const searchLower = searchQuery.toLowerCase();
      menuItems = menuItems.filter(item => {
        const name = (item.nameMap && (item.nameMap.he || item.nameMap.en)) || item.name || '';
        const description = (item.descriptionMap && (item.descriptionMap.he || item.descriptionMap.en)) || item.description || '';
        
        return name.toLowerCase().includes(searchLower) ||
               description.toLowerCase().includes(searchLower) ||
               (item.category && item.category.toLowerCase().includes(searchLower));
      });
      
      return { success: true, foods: menuItems };
    } catch (error) {
      console.error('Error searching menu items:', error);
      return { success: false, error: 'Failed to search menu items' };
    }
  }


}

export default new FoodRepository();
