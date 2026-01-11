const express = require('express');
const router = express.Router();
const currencyService = require('../services/currencyService');

/**
 * GET /api/currency/rates
 * Returns current cached exchange rates
 */
router.get('/rates', async (req, res) => {
  try {
    console.log('📊 [API] GET /api/currency/rates');
    
    const rates = await currencyService.getCachedRates();
    
    if (!rates) {
      // Try to fetch fresh rates if cache is empty
      console.log('⚠️ [API] Cache empty, fetching fresh rates...');
      const freshRates = await currencyService.fetchExchangeRates();
      
      if (freshRates) {
        await currencyService.storeRates(freshRates);
        return res.json({
          success: true,
          rates: freshRates,
          source: 'fresh',
          timestamp: new Date()
        });
      }
      
      return res.status(503).json({
        success: false,
        error: 'Unable to fetch currency rates',
        message: 'Please try again later'
      });
    }

    res.json({
      success: true,
      rates: rates,
      source: 'cached',
      timestamp: new Date()
    });
  } catch (error) {
    console.error('❌ [API] Error in GET /api/currency/rates:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

/**
 * POST /api/currency/update
 * Manually trigger currency rate update (admin only)
 */
router.post('/update', async (req, res) => {
  try {
    console.log('🔄 [API] POST /api/currency/update');
    
    const success = await currencyService.updateRates();
    
    if (success) {
      const rates = await currencyService.getCachedRates();
      return res.json({
        success: true,
        message: 'Currency rates updated successfully',
        rates: rates
      });
    }

    res.status(503).json({
      success: false,
      error: 'Failed to update currency rates'
    });
  } catch (error) {
    console.error('❌ [API] Error in POST /api/currency/update:', error.message);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message
    });
  }
});

module.exports = router;
