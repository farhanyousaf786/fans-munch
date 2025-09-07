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

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
