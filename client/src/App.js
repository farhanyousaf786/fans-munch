import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import { seatStorage } from './utils/storage';

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
import ShopMenuScreen from './pages/shop_menu/ShopMenuScreen';
import OrderConfirmScreen from './pages/order_confirm/OrderConfirmScreen';
import OrderTrackScreen from './pages/order_track/OrderTrackScreen';
import BottomNavigation from './components/bottom_nav_bar/BottomNavigation';
import MenuListPage from './pages/menu/MenuListPage';
import ToastContainer from './components/toast/ToastContainer';

function App() {
  // Parse QR parameters on first load and store seat info
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params && Array.from(params.keys()).length > 0) {
        const seatInfo = {
          row: params.get('row') || '',
          seatNo: params.get('seat') || params.get('seatNo') || '',
          section: params.get('section') || '',
          seatDetails: params.get('details') || params.get('seatDetails') || '',
          area: params.get('area') || '',
          entrance: params.get('entrance') || params.get('gate') || '',
          stand: params.get('stand') || '',
          ticketImage: params.get('ticketImage') || ''
        };
        // If at least one meaningful value present, save
        const hasValue = Object.values(seatInfo).some(v => v && String(v).trim() !== '');
        if (hasValue) {
          seatStorage.setSeatInfo(seatInfo);
        }
      }
    } catch (e) {
      console.log('QR param parse skipped:', e?.message);
    }
  }, []);

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
            <Route path="/menu" element={<MenuListPage />} />
            <Route path="/orders" element={<OrdersScreen />} />
            <Route path="/cart" element={<CartScreen />} />
            <Route path="/profile" element={<ProfileScreen />} />
            
            {/* Food Detail Route */}
            <Route path="/food/:foodId" element={<FoodDetailScreen />} />
            {/* Shop Menu Route */}
            <Route path="/shop-menu/:shopId" element={<ShopMenuScreen />} />
            
            {/* Order Flow Routes */}
            <Route path="/tip" element={<TipScreen />} />
            <Route path="/order/confirm" element={<OrderConfirmScreen />} />
            <Route path="/order/:orderId" element={<OrderTrackScreen />} />
            
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
