// server/index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../client/.env') });
const airwallexRoutes = require('./routes/airwallexRoutes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Routes -> Controllers
app.use('/api/airwallex', airwallexRoutes);

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
