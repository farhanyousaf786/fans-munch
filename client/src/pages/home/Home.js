import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TopSection from './components/top_section/TopSection';
import SearchFilterWidget from './components/search_filter/SearchFilterWidget';
import OffersList from './components/offers_list/OffersList';
import CategoryList from './components/category_list/CategoryList';
import MenuList from './components/menu_list/MenuList';
import ShopList from './components/shop_list/ShopList';
import PromotionBanner from '../../components/promotion/PromotionBanner';
import foodRepository from '../../repositories/foodRepository';
import offerRepository from '../../repositories/offerRepository';
import { stadiumStorage, userStorage } from '../../utils/storage';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Home.css';

function Home() {
  const navigate = useNavigate();
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('all');
  const [availableShops, setAvailableShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersError, setOffersError] = useState(null);

  // Load data on component mount - no stadium requirement for browsing
  useEffect(() => {
    console.log('🏠 Loading Home dashboard');
    
    // Check if URL has seat parameters (from QR code)
    console.log('🔍 [HOME] Checking URL for seat parameters...');
    console.log('🔍 [HOME] Current URL:', window.location.href);
    
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔍 [HOME] URL params:', Object.fromEntries(urlParams.entries()));
    
    const hasSeatParams = urlParams.has('row') || urlParams.has('seat') || urlParams.has('section');
    console.log('🔍 [HOME] Has seat params?', hasSeatParams);
    
    if (hasSeatParams) {
      // Store URL params for later use
      const seatData = {
        row: urlParams.get('row') || '',
        seatNo: urlParams.get('seat') || urlParams.get('seatNo') || '',
        section: urlParams.get('section') || '',
        sectionId: urlParams.get('sectionId') || '',
        entrance: urlParams.get('entrance') || urlParams.get('gate') || '',
        stand: urlParams.get('stand') || '',
        seatDetails: urlParams.get('details') || urlParams.get('seatDetails') || '',
        area: urlParams.get('area') || ''
      };
      
      console.log('✅ [HOME] Extracted seat data:', seatData);
      
      // Store in sessionStorage so it persists during navigation
      sessionStorage.setItem('pending_seat_data', JSON.stringify(seatData));
      console.log('💾 [HOME] Saved to sessionStorage:', sessionStorage.getItem('pending_seat_data'));
      console.log('📍 [HOME] Seat data stored successfully for later use!');
    } else {
      console.log('⚠️ [HOME] No seat parameters found in URL');
    }
    
    loadMenuItems();
    loadOffers();
    loadAvailableShops();
  }, []);

  // Filter menu items and offers when search term or selections change
  useEffect(() => {
    filterMenuItems();
    filterOffers();
  }, [searchTerm, allMenuItems, allOffers, selectedShopId, selectedCategoryId, availableShops]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const selectedStadium = stadiumStorage.getSelectedStadium();
      let result;
      
      if (selectedStadium && selectedStadium.id) {
        result = await foodRepository.getStadiumMenu(selectedStadium.id, 200); // Match menu page limit
      } else {
        result = await foodRepository.getAllMenuItems();
      }
      
      if (result.success) {
        setAllMenuItems(result.foods);
      } else {
        setError(result.error || 'Failed to load menu items');
        setAllMenuItems([]);
      }
    } catch (err) {
      console.error('Error loading menu items:', err);
      setError('Failed to load menu items');
      setAllMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadOffers = async () => {
    try {
      setOffersLoading(true);
      setOffersError(null);
      
      const selectedStadium = stadiumStorage.getSelectedStadium();
      console.log('🏟️ Selected stadium for offers:', selectedStadium);
      let result;
      
      if (selectedStadium && selectedStadium.id) {
        console.log('🔍 Fetching offers for stadium ID:', selectedStadium.id);
        result = await offerRepository.getStadiumOffers(selectedStadium.id, 10);
      } else {
        console.log('🔍 No stadium selected, fetching all offers');
        result = await offerRepository.getAllOffers();
      }
      
      if (result.success) {
        setAllOffers(result.offers);
      } else {
        setOffersError(result.error || 'Failed to load offers');
        setAllOffers([]);
      }
    } catch (err) {
      console.error('Error loading offers:', err);
      setOffersError('Failed to load offers');
      setAllOffers([]);
    } finally {
      setOffersLoading(false);
    }
  };

  const loadAvailableShops = async () => {
    try {
      console.log('🏪 Loading available shops for menu filtering');
      
      const selectedStadium = stadiumStorage.getSelectedStadium();
      if (!selectedStadium || !selectedStadium.id) {
        console.log('⚠️ No stadium selected, no shop filtering applied');
        setAvailableShops([]);
        return;
      }
      
      // Fetch available shops (same logic as ShopList)
      const shopsRef = collection(db, 'shops');
      const q = query(
        shopsRef,
        where('stadiumId', '==', selectedStadium.id),
        where('shopAvailability', '==', true)
      );
      
      const querySnapshot = await getDocs(q);
      const shops = [];
      querySnapshot.forEach((doc) => {
        shops.push(doc.id);
      });
      
      setAvailableShops(shops);
      console.log(`✅ Loaded ${shops.length} available shops for filtering`);
    } catch (err) {
      console.error('❌ Error loading available shops:', err);
      setAvailableShops([]);
    }
  };

  const filterMenuItems = () => {
    let items = allMenuItems;

    // Filter by available shops (always apply if we have stadium selected)
    const selectedStadium = stadiumStorage.getSelectedStadium();
    if (selectedStadium && selectedStadium.id) {
      items = items.filter(item => {
        // If item has shopIds, check if any of them are in available shops
        if (Array.isArray(item.shopIds) && item.shopIds.length > 0) {
          return item.shopIds.some(shopId => availableShops.includes(shopId));
        }
        // If item has a single shopId, check if it's available
        if (item.shopId) {
          return availableShops.includes(item.shopId);
        }
        // If no shop info, include the item (fallback)
        return true;
      });
      console.log(`🏪 Filtered by available shops: ${allMenuItems.length} → ${items.length} items`);
      console.log(`   Available shops: ${availableShops.length > 0 ? availableShops.join(', ') : 'None'}`);
    }

    // If a shop is selected, filter by shopIds containing the shop
    if (selectedShopId) {
      items = items.filter(item => Array.isArray(item.shopIds) && item.shopIds.includes(selectedShopId));
    }

    // Filter by selected category if not 'all'
    if (selectedCategoryId && selectedCategoryId !== 'all') {
      items = items.filter(item => (item.category || '').toLowerCase() === String(selectedCategoryId).toLowerCase());
    }

    // Apply search filtering if present
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(item =>
        (item.name?.toLowerCase().includes(lower)) ||
        (item.description?.toLowerCase().includes(lower)) ||
        (item.category?.toLowerCase().includes(lower)) ||
        (item.nameMap && Object.values(item.nameMap).some(v => String(v).toLowerCase().includes(lower))) ||
        (item.descriptionMap && Object.values(item.descriptionMap).some(v => String(v).toLowerCase().includes(lower)))
      );
    }

    // Sort items: combos first, then regular items
    items.sort((a, b) => {
      if (a.isCombo && !b.isCombo) return -1; // a (combo) comes first
      if (!a.isCombo && b.isCombo) return 1;  // b (combo) comes first
      return 0; // maintain original order for same type
    });

    setFilteredMenuItems(items);
  };

  const filterOffers = () => {
    if (!searchTerm.trim()) {
      setFilteredOffers(allOffers);
    } else {
      const filtered = allOffers.filter(offer =>
        offer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        offer.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOffers(filtered);
    }
  };

  const handleSearch = (searchValue) => {
    setSearchTerm(searchValue);
  };

  const handleFilter = () => {
    console.log('Filter clicked');
  };

  const handleShopSelect = (shop) => {
    setSelectedShopId(shop?.id || null);
  };

  return (
    <div className="home-page">
      <PromotionBanner />
      <TopSection />
      
      <div className="home-content">
                <CategoryList 
                  selectedCategory={selectedCategoryId}
                  onSelect={(id) => setSelectedCategoryId(id)}
                />

        <ShopList onShopSelect={handleShopSelect} />
         
        <MenuList 
          menuItems={filteredMenuItems}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />
        
      </div>
    </div>
  );
};

export default Home;
