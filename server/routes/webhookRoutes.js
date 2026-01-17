const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe requires the RAW body for signature verification
// This route is called by Stripe
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;
