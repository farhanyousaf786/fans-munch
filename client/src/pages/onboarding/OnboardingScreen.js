import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingScreen.css';
import { useTranslation } from '../../i18n/i18n';
import { settingsStorage } from '../../utils/storage';
import { setPreferredCurrency } from '../../services/currencyPreferenceService';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLanguageDialog, setShowLanguageDialog] = useState(false);
  const navigate = useNavigate();
  const { t, lang, setLang } = useTranslation();

  const onboardingSteps = [
    {
      id: 1,
      title: t('onboarding.step1.title'),
      subtitle: t('onboarding.step1.subtitle'),
      description: t('onboarding.step1.description'),
      image: "/assets/images/on-boarding-1.png",
      color: "#000000"
    }
  ];

  const handleNext = () => {
    // Mark onboarding as completed
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Go to stadium selection screen
    // Preserve query parameters from QR code
    const search = window.location.search;
    navigate(`/stadium-selection${search}`);
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Go to stadium selection screen
    // Preserve query parameters from QR code
    const search = window.location.search;
    navigate(`/stadium-selection${search}`);
  };

  const handleLanguageChange = (newLang) => {
    setLang(newLang);
    settingsStorage.setLanguagePreference(newLang);
    
    // Set default currency based on language
    const defaultCurrency = newLang === 'he' ? 'ILS' : 'USD';
    setPreferredCurrency(defaultCurrency);
    console.log(`🌐 [ONBOARDING] Language: ${newLang} → Default currency: ${defaultCurrency}`);
    
    setShowLanguageDialog(false);
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="onboarding-screen" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      <div
        className="onboarding-bg"
        style={{ backgroundImage: `url(${currentStepData.image})` }}
      />
      <div className="onboarding-overlay" />
      <div className="onboarding-container">
        {/* Language Button - Top Center */}
        <button 
          className="language-button" 
          onClick={() => setShowLanguageDialog(true)}
          aria-label="Change language"
          title={t('common.change_language')}
        >
          {lang === 'en' ? 'עברית' : 'English'}
        </button>

        {/* Content */}
        <div className="onboarding-content">
          <div className="onboarding-text top">
            <h1 className="onboarding-title">{currentStepData.title}</h1>
            <h2 className="onboarding-subtitle">{currentStepData.subtitle}</h2>
          </div>

          <div className="onboarding-text bottom">
            <p className="onboarding-description">{currentStepData.description}</p>
          </div>
        </div>

        {/* Navigation */}
        <div className="onboarding-navigation">
          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button className="get-started-button" onClick={handleNext}>
              {t('onboarding.get_started')}
            </button>
          </div>
        </div>
      </div>

      {/* Language Selection Dialog */}
      {showLanguageDialog && (
        <div className="language-dialog-overlay" onClick={() => setShowLanguageDialog(false)}>
          <div className="language-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="language-dialog-header">
              <h3>Select Language</h3>
              <button 
                className="close-dialog" 
                onClick={() => setShowLanguageDialog(false)}
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="language-dialog-content">
              <button
                className={`language-option ${lang === 'en' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('en')}
              >
                <span className="language-flag">🇺🇸</span>
                <span className="language-name">English</span>
                {lang === 'en' && <span className="language-check">✓</span>}
              </button>
              <button
                className={`language-option ${lang === 'he' ? 'active' : ''}`}
                onClick={() => handleLanguageChange('he')}
              >
                <span className="language-flag">🇮🇱</span>
                <span className="language-name">Hebrew</span>
                {lang === 'he' && <span className="language-check">✓</span>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnboardingScreen;

