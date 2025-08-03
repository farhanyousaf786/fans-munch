import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';

// Import all screens
import SplashScreen from './pages/splash/SplashScreen';
import OnboardingScreen from './pages/onboarding/OnboardingScreen';
import AuthScreen from './pages/auth/AuthScreen';
import StadiumSelectionScreen from './pages/stadium/StadiumSelectionScreen';
import Home from './pages/home/Home';
import OrdersScreen from './pages/orders/OrdersScreen';
import CartScreen from './pages/cart/CartScreen';
import ProfileScreen from './pages/profile/ProfileScreen';
import BottomNavigation from './components/bottom_nav_bar/BottomNavigation';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Authentication - First screen */}
            <Route path="/" element={<AuthScreen />} />
            
            {/* Splash Screen - After auth */}
            <Route path="/splash" element={<SplashScreen />} />
            
            {/* Onboarding Flow */}
            <Route path="/onboarding" element={<OnboardingScreen />} />
            
            {/* Authentication (alternate route) */}
            <Route path="/auth" element={<AuthScreen />} />
            
            {/* Stadium Selection */}
            <Route path="/stadium-selection" element={<StadiumSelectionScreen />} />
            
            {/* Main App Routes */}
            <Route path="/home" element={<Home />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            
            {/* Redirect any unknown routes to splash */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Bottom Navigation - Shows on main app screens */}
          <BottomNavigation />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
