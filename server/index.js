// server/index.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const { initializeCurrencyScheduler } = require('./services/currencyService');

const app = express();

// Middlewares
app.use(cors());

// Webhooks must be BEFORE express.json() for raw body access
app.use('/api/webhooks', webhookRoutes);


app.use(express.json());

// Routes -> Controllers
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/currency', currencyRoutes);

// Initialize currency rate scheduler
initializeCurrencyScheduler();

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Catch all handler: send back React's index.html file for any non-API routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'AP endpoint not found' });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});