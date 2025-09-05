import React, { useEffect, useState } from 'react';
import { settingsStorage } from '../../utils/storage';
import './settings.css';
import { useTranslation } from '../../i18n/i18n';

const LanguageScreen = () => {
  const [lang, setLang] = useState(settingsStorage.getLanguagePreference() || 'en');
  const { t } = useTranslation();

  useEffect(() => {
    // Persist preference
    settingsStorage.setLanguagePreference(lang);
    // Update document direction for RTL languages
    const dir = lang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
  }, [lang]);

  return (
    <div className="screen static-screen">
      <h1>{t('settings.select_language')}</h1>
      <div className="section-card">
        <h2>{t('settings.app_language')}</h2>
        <div className="lang-options">
          <button
            className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
            onClick={() => {
              setLang('en');
              window.dispatchEvent(new CustomEvent('language-changed', { detail: 'en' }));
            }}
          >
            {t('settings.english')}
          </button>
          <button
            className={`lang-btn ${lang === 'he' ? 'active' : ''}`}
            onClick={() => {
              setLang('he');
              window.dispatchEvent(new CustomEvent('language-changed', { detail: 'he' }));
            }}
          >
            {t('settings.hebrew')}
          </button>
        </div>
        <p className="helper">{t('settings.rtl_note')}</p>
        <p>{t('settings.current')}: {lang === 'en' ? t('settings.english') : t('settings.hebrew')}</p>
      </div>
    </div>
  );
};

export default LanguageScreen;
