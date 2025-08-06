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
import FoodDetailScreen from './pages/food_detail/FoodDetailScreen';
import TipScreen from './pages/tip/TipScreen';
import OrderConfirmScreen from './pages/order_confirm/OrderConfirmScreen';
import BottomNavigation from './components/bottom_nav_bar/BottomNavigation';
import ToastContainer from './components/toast/ToastContainer';

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
            
            {/* Food Detail Route */}
            <Route path="/food/:foodId" element={<FoodDetailScreen />} />
            
            {/* Order Flow Routes */}
            <Route path="/tip" element={<TipScreen />} />
            <Route path="/order/confirm" element={<OrderConfirmScreen />} />
            
            {/* Redirect any unknown routes to splash */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
          {/* Bottom Navigation - Shows on main app screens */}
          <BottomNavigation />
          
          {/* Toast Container - Shows cart notifications */}
          <ToastContainer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
