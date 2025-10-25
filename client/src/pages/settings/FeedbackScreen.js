import React, { useState } from 'react';
import './ContactScreen.css';
import { MdEmail, MdPhone, MdLocationOn, MdPerson, MdMessage, MdSend, MdCheckCircle } from 'react-icons/md';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { userStorage } from '../../utils/storage';
import { showToast } from '../../components/toast/ToastContainer';

const FeedbackScreen = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
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
    if (!formData.name || !formData.email || !formData.message) {
      showToast('Please fill in all required fields', 'error', 3000);
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
      await addDoc(collection(db, 'contactMessages'), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        subject: formData.subject || 'General Inquiry',
        message: formData.message,
        userId: userData?.id || null,
        userPhone: userData?.phone || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        timestamp: new Date().toISOString()
      });

      // Success
      setSubmitted(true);
      showToast('Message sent successfully! We\'ll get back to you soon.', 'success', 4000);
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });

      // Reset submitted state after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);

    } catch (error) {
      console.error('Error submitting contact form:', error);
      showToast('Failed to send message. Please try again.', 'error', 4000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-screen">
      {/* Hero Section */}
      <div className="contact-hero">
        <div className="hero-content">
          <h1 className="hero-title">Get In Touch</h1>
          <p className="hero-subtitle">We'd love to hear from you. Send us a message and we'll respond as soon as possible.</p>
        </div>
      </div>

      <div className="contact-container">
        {/* Contact Form */}
        <div className="contact-form-section">
          <h2 className="section-title">Send Us a Message</h2>
          
          {submitted ? (
            <div className="success-card">
              <MdCheckCircle className="success-icon" />
              <h3>Thank You!</h3>
              <p>Your message has been received. We'll get back to you within 24 hours.</p>
            </div>
          ) : (
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <MdPerson className="label-icon" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">
                    <MdEmail className="label-icon" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="john@example.com"
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">
                    <MdPhone className="label-icon" />
                    Phone Number (Optional)
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+972 12 345 6789"
                    className="form-input"
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
                    placeholder="How can we help?"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <MdMessage className="label-icon" />
                  Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Tell us what's on your mind..."
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

        {/* Contact Info Sidebar */}
        <div className="contact-info-sidebar">
          <div className="info-card">
            <h3 className="info-title">Contact Information</h3>
            <p className="info-description">Fill out the form and our team will get back to you within 24 hours.</p>

            <div className="info-items">
              <div className="info-item">
                <div className="info-icon">
                  <MdEmail />
                </div>
                <div className="info-content">
                  <h4>Email</h4>
                  <a href="mailto:support@fanmunch.com">support@fanmunch.com</a>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <MdPhone />
                </div>
                <div className="info-content">
                  <h4>Phone</h4>
                  <a href="tel:+972123456789">+972 12 345 6789</a>
                </div>
              </div>

              <div className="info-item">
                <div className="info-icon">
                  <MdLocationOn />
                </div>
                <div className="info-content">
                  <h4>Office</h4>
                  <p>Tel Aviv, Israel</p>
                </div>
              </div>
            </div>

            <div className="social-links">
              <h4 className="social-title">Follow Us</h4>
              <div className="social-icons">
                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaFacebook />
                </a>
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaTwitter />
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaInstagram />
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon">
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackScreen;
