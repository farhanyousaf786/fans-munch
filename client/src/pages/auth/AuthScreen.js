import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import userRepository from '../../repositories/userRepository';
import { userStorage, storageManager } from '../../utils/storage';
import './AuthScreen.css';

const AuthScreen = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
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
        // Validate required fields for registration
        if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
          setError('Please fill in all required fields.');
          return;
        }
        
        // Validate password confirmation
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match.');
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
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  return (
    <div className="auth-screen">
      {/* Upper Section */}
      <div className="auth-upper-section">
        <div className="auth-header">
          <img 
            src="/app_icon.png" 
            alt="Fan Munch Logo" 
            className="app-logo"
          />
          <h1 className="auth-title">Log in</h1>
        </div>
      </div>
      
      {/* Lower Section */}
      <div className="auth-container">

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit}>


          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="firstName">First Name</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  placeholder="Enter your first name"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">Last Name</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  placeholder="Enter your last name"
                  required
                />
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
            <a href="#forgot-password" className="forgot-password">
              Forgot Password?
            </a>
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Re-enter Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                placeholder="Re-enter your password"
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
            {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Toggle */}
        <div className="auth-toggle">
          <p className="toggle-text">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="toggle-button" 
              onClick={toggleAuthMode}
            >
              {isLogin ? 'Register Now' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
