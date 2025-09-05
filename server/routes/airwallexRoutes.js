// server/routes/airwallexRoutes.js
const express = require('express');
const router = express.Router();
const controller = require('../controllers/airwallexController');


// Test payment endpoint (migrated from paymentRoutes)
router.post('/test', controller.testPayment);

module.exports = router;
