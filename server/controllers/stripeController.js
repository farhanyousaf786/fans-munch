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
    
    // Get amount and currency from request
    const { amount, currency = 'USD' } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    // Convert amount to cents (Stripe expects smallest currency unit)
    const amountInCents = Math.round(amount * 100);

    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create({
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'fans-munch-app',
        timestamp: new Date().toISOString()
      }
    });

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
