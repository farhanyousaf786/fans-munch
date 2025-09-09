// server/routes/notificationRoutes.js
const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// Send notification to delivery user about new order
router.post('/send-new-order', notificationController.sendNewOrderNotification);

// Send order status update notification to customer
router.post('/send-status-update', notificationController.sendOrderStatusNotification);

// Get delivery user FCM token
router.get('/delivery-user/:deliveryUserId/token', notificationController.getDeliveryUserToken);

module.exports = router;
