const express = require('express');
const router = express.Router();
const stripeController = require('../controllers/stripeController');

// Public Stripe runtime config (publishable key, vendor account, mode)
router.get('/config', stripeController.getStripePublicConfig);

// Create payment intent
router.post('/create-intent', stripeController.createPaymentIntent);

// Confirm payment (optional - for server-side confirmation)
router.post('/confirm-payment', stripeController.confirmPayment);

module.exports = router;
