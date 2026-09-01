const appConfigService = require('../services/appConfigService');

exports.getPublicConfig = async (req, res) => {
  try {
    const { useTestApis } = await appConfigService.getAppConfig();
    const keys = appConfigService.getStripeKeys(useTestApis);
    const paymentMode = useTestApis ? 'test' : 'live';

    if (!keys.publishableKey) {
      return res.json({
        success: true,
        useTestApis,
        paymentMode,
        stripePublishableKey: null,
        keysConfigured: false,
        message: useTestApis
          ? 'Test Stripe publishable key is not configured on the server.'
          : 'Live Stripe publishable key is not configured on the server.',
      });
    }

    return res.json({
      success: true,
      useTestApis,
      paymentMode,
      stripePublishableKey: keys.publishableKey,
      keysConfigured: true,
    });
  } catch (error) {
    console.error('[Config] Error fetching public config:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Failed to load app configuration',
    });
  }
};
