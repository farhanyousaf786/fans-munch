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
    },
    {
      id: 2,
      title: t('onboarding.step2.title'),
      subtitle: t('onboarding.step2.subtitle'),
      description: t('onboarding.step2.description'),
      image: "/assets/images/on-boarding-2.png",
      color: "#000000"
    },
    {
      id: 3,
      title: t('onboarding.step3.title'),
      subtitle: t('onboarding.step3.subtitle'),
      description: t('onboarding.step3.description'),
      image: "/assets/images/on-boarding-3.png",
      color: "#000000"
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      localStorage.setItem('hasSeenOnboarding', 'true');
      // Go to home page (users can browse without signing in)
      // Preserve query parameters from QR code
      const search = window.location.search;
      navigate(`/home${search}`);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    // Go to home page (users can browse without signing in)
    // Preserve query parameters from QR code
    const search = window.location.search;
    navigate(`/home${search}`);
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
          {/* Progress Indicators */}
          <div className="progress-indicators">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`progress-dot ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
              />
            ))}
          </div>

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            <button className="nav-button next-button" onClick={handleNext} aria-label="Next">
              <svg
                className="nav-icon"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M13 5l7 7-7 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;

