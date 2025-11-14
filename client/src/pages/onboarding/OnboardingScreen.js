import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingScreen.css';
import { useTranslation } from '../../i18n/i18n';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { t, lang } = useTranslation();

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
    navigate(`/stadium${search}`);
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Go to stadium selection screen
    // Preserve query parameters from QR code
    const search = window.location.search;
    navigate(`/stadium${search}`);
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
        {/* Skip Button */}
        <button className="skip-button" onClick={handleSkip}>
          {t('onboarding.skip')}
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
    </div>
  );
};

export default OnboardingScreen;

