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

// Debug: Log the build directory path
console.log('Build directory:', path.join(__dirname, 'build'));

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build'), {
  etag: false,
  maxAge: 0,
  setHeaders: (res, filePath) => {
    console.log('Serving static file:', filePath);
    if (filePath.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (filePath.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// API routes only
app.get('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

// Catch all handler: send back React's index.html file for non-static routes
app.get('*', (req, res) => {
  // Prevent cache for HTML to avoid stale references to old bundles
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
  console.log(`Static files served from: ${path.join(__dirname, 'build')}`);
});
