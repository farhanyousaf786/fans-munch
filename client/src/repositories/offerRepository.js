import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import Offer from '../models/Offer';

class OfferRepository {
  constructor() {
    this.collectionName = 'offers';
  }

  // Get offers by stadium ID - simple query from offers collection
  async getStadiumOffers(stadiumId, limitCount = 10) {
    try {
      console.log('🔍 Fetching offers for stadium:', stadiumId);
      
      // Simple query: get offers from 'offers' collection filtered by stadiumId
      const offersRef = collection(db, 'offers');
      const q = query(
        offersRef,
        where('stadiumId', '==', stadiumId),
        limit(limitCount)
      );
      
      const offersSnapshot = await getDocs(q);
      console.log('📦 Found offers in Firebase:', offersSnapshot.size);
      
      const allOffers = [];
      offersSnapshot.forEach((doc) => {
        try {
          console.log('📄 Processing offer document:', doc.id);
          const data = doc.data();
          console.log('📋 Offer data:', data);
          
          const offer = Offer.fromMap(doc.id, data);
          console.log('✅ Created offer object:', offer);
          
          allOffers.push(offer);
        } catch (error) {
          console.error('❌ Error processing offer document', doc.id, ':', error);
        }
      });
      
      // Sort by creation date (same as Flutter app)
      allOffers.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
        const bTime = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
        return bTime - aTime;
      });
      
      console.log('Returning', allOffers.length, 'valid offers');
      return { success: true, offers: allOffers };
    } catch (error) {
      console.error('Error fetching stadium offers:', error);
      return { success: false, error: 'Failed to fetch offers' };
    }
  }

  // Get all offers (fallback method)
  async getAllOffers(limitCount = 20) {
    try {
      const offersRef = collection(db, 'offers');
      const q = query(
        offersRef,
        where('active', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      
      const offersSnapshot = await getDocs(q);
      const allOffers = [];
      
      offersSnapshot.forEach((doc) => {
        try {
          const data = doc.data();
          const offer = Offer.fromMap(doc.id, data);
          
          // Only include offers with valid discounts
          if (offer.hasValidDiscount()) {
            allOffers.push(offer);
          }
        } catch (error) {
          console.error('Error processing offer document', doc.id, ':', error);
        }
      });
      
      return { success: true, offers: allOffers };
    } catch (error) {
      console.error('Error fetching all offers:', error);
      return { success: false, error: 'Failed to fetch offers' };
    }
  }

  // Search offers by name, description, or category
  async searchOffers(searchTerm, stadiumId = null) {
    try {
      let offers = [];
      
      if (stadiumId) {
        const result = await this.getStadiumOffers(stadiumId, 50);
        offers = result.success ? result.offers : [];
      } else {
        const result = await this.getAllOffers(50);
        offers = result.success ? result.offers : [];
      }
      
      if (searchTerm && searchTerm.trim()) {
        offers = offers.filter(offer =>
          offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          offer.category?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      return { success: true, offers: offers };
    } catch (error) {
      console.error('Error searching offers:', error);
      return { success: false, error: 'Failed to search offers' };
    }
  }
}

export default new OfferRepository();
