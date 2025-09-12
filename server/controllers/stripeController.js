const stripe = require('stripe');

// Resolve runtime mode and keys based on STRIPE_ENV
const getStripeRuntimeConfig = () => {
  const mode = (process.env.STRIPE_ENV || 'live').toLowerCase() === 'test' ? 'test' : 'live';
  const cfg = {
    mode,
    secretKey:
      mode === 'test'
        ? (process.env.STRIPE_SECRET_KEY_TEST || process.env.STRIPE_SECRET_KEY)
        : (process.env.STRIPE_SECRET_KEY_LIVE || process.env.STRIPE_SECRET_KEY),
    publishableKey:
      mode === 'test'
        ? (process.env.STRIPE_PUBLISHABLE_KEY_TEST || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY)
        : (process.env.STRIPE_PUBLISHABLE_KEY_LIVE || process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY),
    vendorConnectedAccountId:
      mode === 'test'
        ? process.env.STRIPE_VENDOR_ACCOUNT_ID_TEST
        : process.env.STRIPE_VENDOR_ACCOUNT_ID_LIVE,
  };
  return cfg;
};

// Initialize Stripe with secret key, update if key changes
let stripeInstance;
let stripeSecretInUse;
const initStripe = () => {
  const { secretKey } = getStripeRuntimeConfig();
  if (!secretKey) {
    throw new Error('Stripe secret key not configured. Set STRIPE_SECRET_KEY_{TEST|LIVE} or STRIPE_SECRET_KEY');
  }
  if (!stripeInstance || stripeSecretInUse !== secretKey) {
    stripeInstance = stripe(secretKey);
    stripeSecretInUse = secretKey;
  }
  return stripeInstance;
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const stripeClient = initStripe();
    const { mode, vendorConnectedAccountId: envVendorId } = getStripeRuntimeConfig();
    
    console.log('[Stripe] Creating payment intent... (mode:', mode, ')');
    
    // Get amount, currency, fees, and optional vendor connected account from request
    const { amount, currency = 'ils', vendorConnectedAccountId: reqVendorId, deliveryFee = 0, tipAmount = 0 } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Prefer request vendor ID, else server-side configured vendor per mode
    const vendorConnectedAccountId = reqVendorId || envVendorId;

    // Convert amount to the smallest currency unit (cents/agorot)
    const amountInCents = Math.round(amount * 100);

    // Calculate platform fees (delivery fee + tip) and vendor amount
    let vendorAmount;
    if (vendorConnectedAccountId) {
      const deliveryFeeInCents = Math.round((deliveryFee || 0) * 100);
      const tipAmountInCents = Math.round((tipAmount || 0) * 100);
      const platformFees = deliveryFeeInCents + tipAmountInCents;
      
      // Vendor gets total amount minus platform fees (delivery + tip)
      vendorAmount = amountInCents - platformFees;
      
      // Ensure vendor amount is not negative
      if (vendorAmount < 0) {
        vendorAmount = 0;
      }
      
      console.log('Stripe] Payment split calculation:', {
        totalAmount: amountInCents,
        deliveryFee: deliveryFeeInCents,
        tipAmount: tipAmountInCents,
        platformFees,
        vendorAmount
      });
    }

    // Build intent payload
    const paymentIntentData = {
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'fans-munch-app',
        timestamp: new Date().toISOString(),
        mode,
      },
    };

    // If vendor account provided, calculate proportional Stripe fee sharing
    if (vendorConnectedAccountId) {
      const deliveryFeeInCents = Math.round((deliveryFee || 0) * 100);
      const tipAmountInCents = Math.round((tipAmount || 0) * 100);
      const basePlatformFees = deliveryFeeInCents + tipAmountInCents;
      const vendorAmount = amountInCents - basePlatformFees;
      
      // Calculate estimated Stripe fees (2.9% + 30¢ converted to agorot)
      const stripePercentageFee = Math.round(amountInCents * 0.029); // 2.9%
      const stripeFixedFee = Math.round(30 * 3.7); // ~30¢ in agorot (approximate conversion)
      const totalStripeFees = stripePercentageFee + stripeFixedFee;
      
      // Calculate proportional fee sharing
      const platformShare = basePlatformFees / amountInCents;
      const vendorShare = vendorAmount / amountInCents;
      
      // Split Stripe fees proportionally
      const platformStripeFee = Math.round(totalStripeFees * platformShare);
      const vendorStripeFee = Math.round(totalStripeFees * vendorShare);
      
      // Platform gets: delivery + tip + vendor's portion of Stripe fees
      const finalPlatformFee = basePlatformFees + vendorStripeFee;
      
      // Vendor gets: item amount - their portion of Stripe fees (deducted from transfer)
      const finalVendorAmount = vendorAmount - vendorStripeFee;
      
      paymentIntentData.application_fee_amount = finalPlatformFee;
      paymentIntentData.transfer_data = {
        destination: vendorConnectedAccountId,
      };
      paymentIntentData.metadata.vendorAccountId = vendorConnectedAccountId;
      paymentIntentData.metadata.deliveryFee = deliveryFee;
      paymentIntentData.metadata.tipAmount = tipAmount;
      paymentIntentData.metadata.basePlatformFee = basePlatformFees / 100;
      paymentIntentData.metadata.estimatedStripeFees = totalStripeFees / 100;
      paymentIntentData.metadata.platformStripeFee = platformStripeFee / 100;
      paymentIntentData.metadata.vendorStripeFee = vendorStripeFee / 100;
      paymentIntentData.metadata.finalPlatformFee = finalPlatformFee / 100;
      paymentIntentData.metadata.feeSharing = 'proportional_prededucted';
      
      console.log('[Stripe] Proportional fee pre-deduction structure:', {
        totalAmount: amountInCents / 100,
        basePlatformFee: basePlatformFees / 100,
        baseVendorAmount: vendorAmount / 100,
        estimatedStripeFees: totalStripeFees / 100,
        platformShare: `${(platformShare * 100).toFixed(1)}%`,
        vendorShare: `${(vendorShare * 100).toFixed(1)}%`,
        platformStripeFee: platformStripeFee / 100,
        vendorStripeFee: vendorStripeFee / 100,
        finalPlatformFee: finalPlatformFee / 100,
        finalVendorReceives: finalVendorAmount / 100,
        note: 'Vendor Stripe fees pre-deducted and added to platform application fee'
      });
    }

    // Debug: Log final PaymentIntent data before creation
    console.log('[DEBUG] Final PaymentIntent data:', JSON.stringify(paymentIntentData, null, 2));

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);

    console.log('[Stripe] Payment intent created:', paymentIntent.id);

    return res.json({
      success: true,
      intentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      mode: 'stripe'
    });

  } catch (error) {
    console.error('[Stripe] Error creating payment intent:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create payment intent'
    });
  }
};









// Public config endpoint for client to fetch publishable key and mode at runtime
exports.getStripePublicConfig = async (req, res) => {
  try {
    const { mode, publishableKey, vendorConnectedAccountId } = getStripeRuntimeConfig();
    if (!publishableKey) {
      return res.status(500).json({ success: false, error: 'Stripe publishable key not configured' });
    }
    return res.json({
      success: true,
      mode,
      publishableKey,
      vendorConnectedAccountId: vendorConnectedAccountId || null,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Failed to load Stripe config' });
  }
};

exports.confirmPayment = async (req, res) => {
  try {
    const stripeClient = initStripe();
    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        error: 'Payment intent ID is required'
      });
    }

    // Retrieve payment intent to check status
    const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentIntentId);

    return res.json({
      success: true,
      status: paymentIntent.status,
      paymentIntent: {
        id: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency
      }
    });

  } catch (error) {
    console.error('[Stripe] Error confirming payment:', error.message);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to confirm payment'
    });
  }
};
