import React, { useState } from 'react';
import './HelpScreen.css';
import { MdEmail, MdMessage, MdSend, MdCheckCircle, MdHelp } from 'react-icons/md';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { userStorage } from '../../utils/storage';
import { showToast } from '../../components/toast/ToastContainer';

const HelpScreen = () => {
  const [formData, setFormData] = useState({
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email || !formData.subject || !formData.message) {
      showToast('Please fill in all fields', 'error', 3000);
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      showToast('Please enter a valid email address', 'error', 3000);
      return;
    }

    setLoading(true);

    try {
      // Get user data if logged in
      const userData = userStorage.getUserData();
      
      // Save to Firebase
      await addDoc(collection(db, 'complaints'), {
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        userId: userData?.id || null,
        userName: userData ? `${userData.firstName || ''} ${userData.lastName || ''}`.trim() : 'Guest',
        userPhone: userData?.phone || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      });

      // Success
      setSubmitted(true);
      showToast('Your message has been sent successfully!', 'success', 4000);
      
      // Reset form
      setFormData({
        email: '',
        subject: '',
        message: ''
      });

      // Reset submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting complaint:', error);
      showToast('Failed to send message. Please try again.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  const faqItems = [
    {
      question: 'How do I place an order?',
      answer: 'Browse the menu, add items to cart, enter your seat details, and complete payment.'
    },
    {
      question: 'How long does delivery take?',
      answer: 'Typically 15-20 minutes depending on stadium location and order volume.'
    },
    {
      question: 'Can I cancel my order?',
      answer: 'Orders can be cancelled within 2 minutes of placement. Contact support for assistance.'
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards via Stripe and Airwallex payment gateways.'
    },
    {
      question: 'How do I track my order?',
      answer: 'After placing an order, you\'ll see a tracking screen showing real-time status updates.'
    }
  ];

  return (
    <div className="help-screen">
      {/* Hero Section */}
      <div className="help-hero">
        <div className="hero-icon">
          <MdHelp />
        </div>
        <h1 className="hero-title">How Can We Help?</h1>
        <p className="hero-subtitle">Get support or send us your feedback</p>
      </div>

      {/* FAQ Section */}
      <div className="help-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className="faq-item">
              <h3 className="faq-question">{item.question}</h3>
              <p className="faq-answer">{item.answer}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      <div className="help-section contact-section">
        <h2 className="section-title">Send Us a Message</h2>
        <p className="section-subtitle">Have a complaint or suggestion? We'd love to hear from you!</p>

        {submitted ? (
          <div className="success-message">
            <MdCheckCircle className="success-icon" />
            <h3>Thank You!</h3>
            <p>Your message has been received. We'll get back to you soon.</p>
          </div>
        ) : (
          <form className="contact-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">
                <MdEmail className="label-icon" />
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="your.email@example.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <MdMessage className="label-icon" />
                Subject
              </label>
              <input
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="What is this about?"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <MdMessage className="label-icon" />
                Message
              </label>
              <textarea
                name="message"
                value={formData.message}
                onChange={handleChange}
                placeholder="Tell us more about your issue or feedback..."
                className="form-textarea"
                rows="6"
                required
              />
            </div>

            <button 
              type="submit" 
              className="submit-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Sending...
                </>
              ) : (
                <>
                  <MdSend className="button-icon" />
                  Send Message
                </>
              )}
            </button>
          </form>
        )}
      </div>

      {/* Contact Info */}
      <div className="help-section contact-info-section">
        <h2 className="section-title">Other Ways to Reach Us</h2>
        <div className="contact-methods">
          <div className="contact-method">
            <MdEmail className="method-icon" />
            <div className="method-details">
              <h3 className="method-title">Email</h3>
              <a href="mailto:support@fanmunch.com" className="method-link">
                support@fanmunch.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpScreen;
