import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './OnboardingScreen.css';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();

  const onboardingSteps = [
    {
      id: 1,
      title: "Welcome to Food Munch",
      subtitle: "Your favorite food delivered fresh",
      description: "Discover delicious meals from top restaurants and get them delivered right to your doorstep in minutes.",
      image: "🍕",
      color: "#ff6b35"
    },
    {
      id: 2,
      title: "Fast & Fresh Delivery",
      subtitle: "Quick delivery in 30 minutes",
      description: "Our delivery partners ensure your food arrives hot and fresh. Track your order in real-time from kitchen to your door.",
      image: "🚚",
      color: "#f7931e"
    },
    {
      id: 3,
      title: "Easy Ordering",
      subtitle: "Order with just a few taps",
      description: "Browse menus, customize your order, and pay securely. Save your favorites for quick reordering anytime.",
      image: "📱",
      color: "#ff8c42"
    }
  ];

  const handleNext = () => {
    if (currentStep < onboardingSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark onboarding as completed
      localStorage.setItem('hasSeenOnboarding', 'true');
      navigate('/stadium-selection');
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSeenOnboarding', 'true');
    navigate('/stadium');
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="onboarding-screen">
      <div className="onboarding-container">
        {/* Skip Button */}
        <button className="skip-button" onClick={handleSkip}>
          Skip
        </button>

        {/* Content */}
        <div className="onboarding-content">
          <div className="onboarding-image">
            <div className="image-circle">
              <span className="image-emoji">{currentStepData.image}</span>
            </div>
          </div>

          <div className="onboarding-text">
            <h1 className="onboarding-title">{currentStepData.title}</h1>
            <h2 className="onboarding-subtitle">{currentStepData.subtitle}</h2>
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
            {currentStep > 0 && (
              <button className="nav-button prev-button" onClick={() => setCurrentStep(currentStep - 1)}>
                Previous
              </button>
            )}
            
            <button className="nav-button next-button" onClick={handleNext}>
              {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingScreen;
