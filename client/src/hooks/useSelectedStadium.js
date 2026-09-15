import { useState, useEffect, useCallback } from 'react';
import { stadiumStorage } from '../utils/storage';
import { refreshSelectedStadiumFromFirestore } from '../utils/stadiumSync';

export function useSelectedStadium() {
  const [stadium, setStadium] = useState(() => stadiumStorage.getSelectedStadium());

  const loadStadium = useCallback(async () => {
    const cached = stadiumStorage.getSelectedStadium();
    if (!cached?.id) {
      setStadium(cached || null);
      return;
    }
    const merged = await refreshSelectedStadiumFromFirestore();
    setStadium(merged || cached);
  }, []);

  useEffect(() => {
    loadStadium();
    window.addEventListener('stadium-changed', loadStadium);
    return () => window.removeEventListener('stadium-changed', loadStadium);
  }, [loadStadium]);

  const displayName = stadium?.brandName || stadium?.name || '';
  // Logo is separate from stadium profile photo — only use logoUrl
  const logoUrl = stadium?.logoUrl || '';

  return { stadium, displayName, logoUrl };
}

export default useSelectedStadium;
