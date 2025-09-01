import React, { useEffect, useState } from 'react';
import { settingsStorage } from '../../utils/storage';
import './settings.css';

const LanguageScreen = () => {
  const [lang, setLang] = useState(settingsStorage.getLanguagePreference() || 'en');

  useEffect(() => {
    // Persist preference
    settingsStorage.setLanguagePreference(lang);
    // Update document direction for RTL languages
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
  }, [lang]);

  return (
    <div className="screen static-screen">
      <h1>Select Language</h1>
      <div className="section-card">
        <h2>App Language</h2>
        <div className="lang-options">
          <button className={`lang-btn ${lang === 'en' ? 'active' : ''}`} onClick={() => setLang('en')}>English</button>
          <button className={`lang-btn ${lang === 'he' ? 'active' : ''}`} onClick={() => setLang('he')}>עברית (Hebrew)</button>
        </div>
        <p className="helper">The interface direction will switch automatically for Hebrew (RTL).</p>
        <p>Current: {lang === 'en' ? 'English' : 'Hebrew'}</p>
      </div>
    </div>
  );
};

export default LanguageScreen;
