// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
// Load env variables from root .env unconditionally (useful if NODE_ENV is set to 'production' locally)
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
// Debug (do not print secrets)
console.log('[ENV] STRIPE key present:', process.env.STRIPE_SECRET_KEY ? 'yes' : 'no');
const airwallexRoutes = require('./routes/airwallexRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const currencyRoutes = require('./routes/currencyRoutes');
const { initializeCurrencyScheduler } = require('./services/currencyService');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes -> Controllers
app.use('/api/airwallex', airwallexRoutes);
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