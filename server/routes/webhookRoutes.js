const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Test endpoint to verify webhook is reachable
router.get('/stripe/test', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Webhook endpoint is reachable',
    webhookSecretConfigured: !!process.env.STRIPE_WEBHOOK_SECRET
  });
});

// Stripe requires the RAW body for signature verification
// This route is called by Stripe
router.post('/stripe', express.raw({ type: 'application/json' }), webhookController.handleStripeWebhook);

module.exports = router;
