const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { doc, updateDoc } = require('firebase/firestore');

// Update stadium flags (temporary admin endpoint for development)
router.post('/update-stadium', async (req, res) => {
  try {
    const { stadiumId, flags } = req.body;
    
    if (!stadiumId || !flags) {
      return res.status(400).json({ error: 'Missing stadiumId or flags' });
    }

    const stadiumRef = doc(db, 'stadiums', stadiumId);
    await updateDoc(stadiumRef, flags);
    
    res.json({ success: true, message: 'Stadium updated', stadiumId, flags });
  } catch (error) {
    console.error('Error updating stadium:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
