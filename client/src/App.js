import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { seatStorage, userStorage } from './utils/storage';
import { ComboProvider } from './contexts/ComboContext';
import { ThemeProvider } from './context/ThemeContext';
import { I18nProvider } from './i18n/i18n';
import LogRocket from 'logrocket';
import { initializeCurrencyRates, getCacheStatus } from './services/currencyInitService';

// Import all screens
import SplashScreen from './pages/splash/SplashScreen';
import OnboardingScreen from './pages/onboarding/OnboardingScreen';
import AuthScreen from './pages/auth/AuthScreen';
import ForgotPasswordScreen from './pages/auth/ForgotPasswordScreen';
import StadiumSelectionScreen from './pages/stadium/StadiumSelectionScreen';
import Home from './pages/home/Home';
import OrdersScreen from './pages/orders/OrdersScreen';
import CartScreen from './pages/cart/CartScreen';
import PreCartPage from './pages/precart/PreCartPage';
import ProfileScreen from './pages/profile/ProfileScreen';
import FoodDetailScreen from './pages/food_detail/FoodDetailScreen';
import TipScreen from './pages/tip/TipScreen';
import ShopMenuScreen from './pages/shop_menu/ShopMenuScreen';
import OrderConfirmScreen from './pages/order_confirm/OrderConfirmScreen';
import OrderTrackScreen from './pages/order_track/OrderTrackScreen';
import FanmunchQrCode from './pages/tools/FanmunchQrCode';
import BottomNavigation from './components/bottom_nav_bar/BottomNavigation';
import Footer from './components/footer/Footer';
import MenuListPage from './pages/menu/MenuListPage';
import ToastContainer from './components/toast/ToastContainer';
// Settings screens
import AboutAppScreen from './pages/settings/AboutAppScreen';
import TermsScreen from './pages/settings/TermsScreen';
import PrivacyPolicyScreen from './pages/settings/PrivacyPolicyScreen';
import FeedbackScreen from './pages/settings/FeedbackScreen';
import ReportProblemScreen from './pages/settings/ReportProblemScreen';
import LanguageScreen from './pages/settings/LanguageScreen';
import CurrencySettingsScreen from './pages/settings/CurrencySettingsScreen';
import HelpScreen from './pages/settings/HelpScreen';

// Component to conditionally show footer
const ConditionalFooter = () => {
  const location = useLocation();
  const hideFooterPaths = ['/', '/onboarding', '/auth', '/forgot-password', '/splash'];
  
  if (hideFooterPaths.includes(location.pathname)) {
    return null;
  }
  
  return <Footer />;
};

// Component to redirect root to onboarding or home based on auth status
const RootRedirect = () => {
  // Use window.location.search instead of useLocation() to get query params
  const search = window.location.search;
  const isLoggedIn = localStorage.getItem('userToken');
  const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
  
  console.log('🔀 [REDIRECT] window.location.search:', search);
  console.log('🔀 [REDIRECT] isLoggedIn:', !!isLoggedIn);
  console.log('🔀 [REDIRECT] hasSeenOnboarding:', !!hasSeenOnboarding);
  
  // If logged in, always go to home with query params
  if (isLoggedIn) {
    console.log('🔀 [REDIRECT] Logged in, redirecting to:', `/home${search}`);
    return <Navigate to={`/home${search}`} replace />;
  }
  
  // If not logged in AND hasn't seen onboarding, show onboarding first
  if (!hasSeenOnboarding) {
    return <Navigate to={`/onboarding${search}`} replace />;
  }
  
  console.log('🔀 [REDIRECT] Not logged in but seen onboarding, redirecting to home');
  return <Navigate to={`/home${search}`} replace />;
};

// Initialize LogRocket
try {
  // LogRocket.init('cvlyge/fanmunch');
  console.log('📊 [LogRocket] Successfully initialized');
  console.log('📊 [LogRocket] Environment:', process.env.NODE_ENV);
  console.log('📊 [LogRocket] Hostname:', window.location.hostname);
} catch (error) {
  console.error('📊 [LogRocket] Failed to initialize:', error);
}

function App() {
  // Initialize currency rates on app startup
  useEffect(() => {
    console.log('🚀 [APP] Initializing app...');
    initializeCurrencyRates();
    const status = getCacheStatus();
    if (status) {
      console.log('📊 [APP] Cache status:', status.message);
    }
  }, []);

  // Parse QR parameters on first load and store seat info
  // Supports both fanmunch.com and localhost domains
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params && Array.from(params.keys()).length > 0) {
        const seatInfo = {
          row: params.get('row') || '',
          seatNo: params.get('seat') || params.get('seatNo') || '',
          section: params.get('section') || '',
          sectionId: params.get('sectionId') || '',
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
          console.log('🎫 QR parameters parsed and saved:', seatInfo);
        }
      }
    } catch (e) {
      console.log('QR param parse skipped:', e?.message);
    }
  }, []);

  // Identify user in LogRocket when user data is available
  useEffect(() => {
    try {
      const userData = userStorage.getUserData();
      if (userData && userData.id) {
        LogRocket.identify(userData.id, {
          name: `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || 'Unknown',
          email: userData.email || '',
          phone: userData.phone || ''
        });
        console.log('📊 [LogRocket] User identified:', userData.id);
      }
    } catch (error) {
      console.error('📊 [LogRocket] Failed to identify user:', error);
    }
  }, []);

  return (
    <I18nProvider>
      <ThemeProvider>
        <ComboProvider>
          <Router>
            <div className="app">
              <Routes>
                {/* Landing page goes to Home regardless of auth - preserve query params */}
                <Route path="/" element={<RootRedirect />} />
                
                {/* Splash Screen - After auth */}
                <Route path="/splash" element={<SplashScreen />} />
                
                {/* Onboarding Flow */}
                <Route path="/onboarding" element={<OnboardingScreen />} />
                
                {/* Authentication (alternate route) */}
                <Route path="/auth" element={<AuthScreen />} />
                <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
                
                {/* Stadium Selection */}
                <Route path="/stadium-selection" element={<StadiumSelectionScreen />} />
                
                {/* Main App Routes */}
                <Route path="/home" element={<Home />} />
                <Route path="/menu" element={<MenuListPage />} />
                <Route path="/orders" element={<OrdersScreen />} />
                <Route path="/cart" element={<CartScreen />} />
                <Route path="/precart" element={<PreCartPage />} />
                <Route path="/profile" element={<ProfileScreen />} />
                {/* Settings */}
                <Route path="/settings/about" element={<AboutAppScreen />} />
                <Route path="/settings/terms" element={<TermsScreen />} />
                <Route path="/settings/privacy" element={<PrivacyPolicyScreen />} />
                <Route path="/settings/feedback" element={<FeedbackScreen />} />
                <Route path="/settings/report" element={<ReportProblemScreen />} />
                <Route path="/settings/language" element={<LanguageScreen />} />
                <Route path="/settings/currency" element={<CurrencySettingsScreen />} />
                <Route path="/settings/help" element={<HelpScreen />} />
                
                {/* Food Detail Route */}
                <Route path="/food/:foodId" element={<FoodDetailScreen />} />
                {/* Shop Menu Route */}
                <Route path="/shop-menu/:shopId" element={<ShopMenuScreen />} />
                
                {/* Order Flow Routes */}
                <Route path="/tip" element={<TipScreen />} />
                <Route path="/order/confirm" element={<OrderConfirmScreen />} />
                <Route path="/order/:orderId" element={<OrderTrackScreen />} />
                {/* Tools */}
                <Route path="/tools/fanmunch-qr" element={<FanmunchQrCode />} />
                
                {/* Redirect any unknown routes to splash */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
              
              {/* Bottom Navigation - Shows on main app screens */}
              <BottomNavigation />

            {/* Global footer - Conditionally shown */}
            <ConditionalFooter />

            {/* Toast Container - Shows cart notifications */}
            <ToastContainer />
          </div>
        </Router>
      </ComboProvider>
      </ThemeProvider>
    </I18nProvider>
  );
}

export default App;
