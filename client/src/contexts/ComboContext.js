import React, { createContext, useContext, useState, useEffect } from 'react';
import foodRepository from '../repositories/foodRepository';

const ComboContext = createContext();

export const useCombo = () => {
  const context = useContext(ComboContext);
  if (!context) {
    throw new Error('useCombo must be used within a ComboProvider');
  }
  return context;
};

export const ComboProvider = ({ children }) => {
  const [comboItemsCache, setComboItemsCache] = useState({});
  const [loadingCombos, setLoadingCombos] = useState({});

  // Fetch combo items for a specific combo
  const fetchComboItems = async (comboId, comboItemIds) => {
    if (!comboItemIds || comboItemIds.length === 0) return [];
    
    // Check cache first
    const cacheKey = comboItemIds.join(',');
    if (comboItemsCache[cacheKey]) {
      return comboItemsCache[cacheKey];
    }

    // Check if already loading
    if (loadingCombos[cacheKey]) {
      return [];
    }

    try {
      setLoadingCombos(prev => ({ ...prev, [cacheKey]: true }));
      
      const result = await foodRepository.getComboItems(comboItemIds);
      if (result.success) {
        setComboItemsCache(prev => ({
          ...prev,
          [cacheKey]: result.foods
        }));
        return result.foods;
      }
    } catch (error) {
      console.error('Error fetching combo items:', error);
    } finally {
      setLoadingCombos(prev => ({ ...prev, [cacheKey]: false }));
    }

    return [];
  };

  // Get cached combo items
  const getCachedComboItems = (comboItemIds) => {
    if (!comboItemIds || comboItemIds.length === 0) return [];
    const cacheKey = comboItemIds.join(',');
    return comboItemsCache[cacheKey] || [];
  };

  const value = {
    fetchComboItems,
    getCachedComboItems,
    comboItemsCache,
    loadingCombos
  };

  return (
    <ComboContext.Provider value={value}>
      {children}
    </ComboContext.Provider>
  );
};

export default ComboContext;
