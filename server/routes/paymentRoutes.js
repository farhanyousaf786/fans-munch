// server/routes/paymentRoutes.js
const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

// POST /api/payments/create-intent
router.post('/create-intent', paymentController.createPaymentIntent);

module.exports = router;
