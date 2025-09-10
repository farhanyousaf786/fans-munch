// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
// Load env from project root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const airwallexRoutes = require('./routes/airwallexRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes -> Controllers
app.use('/api/airwallex', airwallexRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api/notifications', notificationRoutes);

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// SPA fallback: send index.html for app routes without a file extension.
// IMPORTANT: Do NOT serve index.html for missing static assets (e.g., old hashed bundles),
// otherwise the browser will receive HTML when it expects JS and crash with "Unexpected token '<'".
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }

  // If the request has a file extension (e.g., .js, .css, .png), let static middleware handle it
  // and if it doesn't exist, return a 404 instead of index.html
  const hasExtension = path.extname(req.path) !== '';
  if (hasExtension) return res.status(404).end();

  // Otherwise, return the SPA entry
  return res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});