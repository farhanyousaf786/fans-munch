import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userRepository from '../../repositories/userRepository';
import { userStorage, storageManager } from '../../utils/storage';
import './AuthScreen.css';
import { useTranslation } from '../../i18n/i18n';

const AuthScreen = () => {
  const { t, lang } = useTranslation();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('🔑 User signing in...');
        
        // Clear all previous storage data for fresh session
        storageManager.initializeFreshSession();
        
        // Sign in user
        const user = await userRepository.signInUser(formData.email, formData.password);
        
        // Save user data and token to localStorage
        userStorage.setUserData(user.toMap());
        userStorage.setUserToken(`token_${user.id || Date.now()}`);
        
        console.log('✅ Sign in completed, navigating to onboarding');
        
        // Navigate to onboarding
        navigate('/onboarding');
      } else {
        // Validate required fields for registration (phone is mandatory)
        if (!formData.firstName || !formData.lastName || !formData.phone || !formData.email || !formData.password || !formData.confirmPassword) {
          setError(t('auth.fill_required'));
          return;
        }

        // Basic phone validation (at least 7 digits)
        const digits = String(formData.phone || '').replace(/\D/g, '');
        if (digits.length < 7) {
          setError('Please enter a valid phone number');
          return;
        }
        
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwords_no_match'));
          return;
        }
        
        console.log('📝 User registering...');
        
        // Clear all previous storage data for fresh session
        storageManager.initializeFreshSession();
        
        // Register new user
        const result = await userRepository.registerUser(formData);
        
        if (result.success) {
          // Save user data and token to localStorage
          userStorage.setUserData(result.user.toMap());
          userStorage.setUserToken(`token_${result.user.id || Date.now()}`);
          
          console.log('✅ Registration completed, navigating to onboarding');
          
          // Navigate to onboarding
          navigate('/onboarding');
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setFormData({
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-screen" dir={lang === 'he' ? 'rtl' : 'ltr'}>
      {/* Upper Section */}
      <div className="auth-upper-section">
        <div className="auth-header">
          <img 
            src="/app_icon.png" 
            alt="Fan Munch Logo" 
            className="app-logo"
          />
          <h1 className="auth-title">{isLogin ? t('auth.title_login') : t('auth.title_register')}</h1>
        </div>
      </div>
      
      {/* Lower Section */}
      <div className="auth-container">

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>


          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">{t('auth.first_name')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder={t('auth.first_name')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('auth.last_name')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder={t('auth.last_name')}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">{t('auth.phone') || 'Phone'}</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder={t('auth.phone_ph') || '+972 50-123-4567'}
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">{t('auth.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder={t('auth.email_ph')}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('auth.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder={t('auth.password_ph')}
              required
            />
            {isLogin && (
              <a href="#forgot-password" className="forgot-password">
                {t('auth.forgot_password')}
              </a>
            )}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">{t('auth.confirm_password')}</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder={t('auth.confirm_password_ph')}
                required
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? t('auth.please_wait') : (isLogin ? t('auth.sign_in') : t('auth.create_account'))}
          </button>
        </form>

        {/* Toggle */}
        <div className="auth-toggle">
          <p className="toggle-text">
            {isLogin ? t('auth.toggle_no_account') : t('auth.toggle_have_account')}
            <button 
              type="button" 
              className="toggle-button" 
              onClick={toggleAuthMode}
            >
              {isLogin ? t('auth.toggle_register_now') : t('auth.toggle_sign_in')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
