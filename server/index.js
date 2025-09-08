// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
// Load env from project root .env
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const airwallexRoutes = require('./routes/airwallexRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes -> Controllers
app.use('/api/airwallex', airwallexRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/stripe', stripeRoutes);

// Serve static files from React build (this must come before the catch-all route)
app.use(express.static(path.join(__dirname, 'build')));

// Catch all handler: send back React's index.html file for any non-API and non-static routes
app.get('*', (req, res) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Skip static file routes (they should have been handled above)
  if (req.path.startsWith('/static/')) {
    return res.status(404).json({ error: 'Static file not found' });
  }
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'build')}`);
});
