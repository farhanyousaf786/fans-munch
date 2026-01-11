import React, { useEffect, useState } from 'react';
import { settingsStorage } from '../../utils/storage';
import './settings.css';
import { useTranslation } from '../../i18n/i18n';
import { setPreferredCurrency } from '../../services/currencyPreferenceService';

const LanguageScreen = () => {
  const { t, lang, setLang } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(lang);

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    setSelectedLang(newLang);
    settingsStorage.setLanguagePreference(newLang);
    const dir = newLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    window.dispatchEvent(new CustomEvent('language-changed', { detail: newLang }));
    
    // Set default currency based on language
    const defaultCurrency = newLang === 'he' ? 'ILS' : 'USD';
    setPreferredCurrency(defaultCurrency);
    console.log(`🌐 [LANGUAGE SETTINGS] Language: ${newLang} → Default currency: ${defaultCurrency}`);
  };

  return (
    <div className="screen static-screen">
      <h1>Settings</h1>
      <div className="section-card">
        <h2>App Language</h2>
        <div className="lang-options">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('en')}
          >
            English
          </button>
          <button
            className={`lang-btn ${lang === 'he' ? 'active' : ''}`}
            onClick={() => handleLanguageChange('he')}
          >
            {lang === 'he' ? 'עברית' : 'Hebrew'}
          </button>
        </div>
        <p className="helper">The interface direction will switch automatically for Hebrew (RTL).</p>
        <p>Current: {lang === 'en' ? 'English' : 'Hebrew'}</p>
      </div>
    </div>
  );
};

export default LanguageScreen;
