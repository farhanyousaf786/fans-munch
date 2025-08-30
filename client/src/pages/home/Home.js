import React, { useState, useEffect } from 'react';
import TopSection from './components/top_section/TopSection';
import SearchFilterWidget from './components/search_filter/SearchFilterWidget';
import OffersList from './components/offers_list/OffersList';
import CategoryList from './components/category_list/CategoryList';
import MenuList from './components/menu_list/MenuList';
import ShopList from './components/shop_list/ShopList';
import foodRepository from '../../repositories/foodRepository';
import offerRepository from '../../repositories/offerRepository';
import { stadiumStorage } from '../../utils/storage';
import './Home.css';

function Home() {
  const [allMenuItems, setAllMenuItems] = useState([]);
  const [filteredMenuItems, setFilteredMenuItems] = useState([]);
  const [allOffers, setAllOffers] = useState([]);
  const [filteredOffers, setFilteredOffers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedShopId, setSelectedShopId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [offersLoading, setOffersLoading] = useState(true);
  const [error, setError] = useState(null);
  const [offersError, setOffersError] = useState(null);

  // Load menu items and offers once on component mount
  useEffect(() => {
    loadMenuItems();
    loadOffers();
  }, []);

  // Filter menu items and offers when search term or selections change
  useEffect(() => {
    filterMenuItems();
    filterOffers();
  }, [searchTerm, allMenuItems, allOffers, selectedShopId]);

  const loadMenuItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const selectedStadium = stadiumStorage.getSelectedStadium();
      let result;
      
      if (selectedStadium && selectedStadium.id) {
        result = await foodRepository.getStadiumMenu(selectedStadium.id, 20); // Load more items for better search
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

  const filterMenuItems = () => {
    let items = allMenuItems;

    // If a shop is selected, filter by shopIds containing the shop
    if (selectedShopId) {
      items = items.filter(item => Array.isArray(item.shopIds) && item.shopIds.includes(selectedShopId));
    }

    // Apply search filtering if present
    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.name?.toLowerCase().includes(lower) ||
        item.description?.toLowerCase().includes(lower) ||
        item.category?.toLowerCase().includes(lower)
      );
    }

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
      <TopSection />
      
      <div className="home-content">


      


                <CategoryList />

         
        <MenuList 
          menuItems={filteredMenuItems}
          loading={loading}
          error={error}
          searchTerm={searchTerm}
        />

     
       <OffersList 
          offers={filteredOffers}
          loading={offersLoading}
          error={offersError}
          searchTerm={searchTerm}
        />
        
        <ShopList onShopSelect={handleShopSelect} />
        
      </div>
    </div>
  );
};

export default Home;
