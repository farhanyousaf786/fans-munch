const stripe = require('stripe');

// Initialize Stripe with secret key
let stripeInstance;
const initStripe = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY environment variable is required');
  }
  if (!stripeInstance) {
    stripeInstance = stripe(secretKey);
  }
  return stripeInstance;
};

exports.createPaymentIntent = async (req, res) => {
  try {
    const stripeClient = initStripe();
    
    console.log('[Stripe] Creating payment intent...');
    
    // Get amount, currency, fees, and optional vendor connected account from request
    const { amount, currency = 'ils', vendorConnectedAccountId, deliveryFee = 0, tipAmount = 0 } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

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
      },
    };

    // If vendor account provided, use application_fee_amount for clearer platform revenue
    if (vendorConnectedAccountId) {
      const deliveryFeeInCents = Math.round((deliveryFee || 0) * 100);
      const tipAmountInCents = Math.round((tipAmount || 0) * 100);
      const platformFees = deliveryFeeInCents + tipAmountInCents;
      
      // Use application_fee_amount - platform keeps this amount explicitly
      paymentIntentData.application_fee_amount = platformFees;
      paymentIntentData.transfer_data = {
        destination: vendorConnectedAccountId,
      };
      paymentIntentData.metadata.vendorAccountId = vendorConnectedAccountId;
      paymentIntentData.metadata.deliveryFee = deliveryFee;
      paymentIntentData.metadata.tipAmount = tipAmount;
      paymentIntentData.metadata.platformFee = platformFees / 100; // Store in original currency
      
      console.log('[Stripe] Platform fee structure:', {
        totalAmount: amountInCents,
        platformFee: platformFees,
        vendorReceives: amountInCents - platformFees
      });
    }

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
