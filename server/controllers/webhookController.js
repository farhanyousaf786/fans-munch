const stripe = require('stripe');

// Initialize Stripe helper
let stripeInstance;
const getStripe = () => {
  if (!stripeInstance) {
    stripeInstance = stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeInstance;
};

exports.handleStripeWebhook = async (req, res) => {
  console.log('\n🔔 ========== WEBHOOK RECEIVED ==========');
  console.log('📥 Headers:', JSON.stringify(req.headers, null, 2));
  console.log('📦 Body type:', typeof req.body);
  console.log('📦 Body length:', req.body ? req.body.length : 0);
  
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  const stripeClient = getStripe();

  console.log('🔑 Webhook secret present:', !!endpointSecret);
  console.log('✍️ Signature present:', !!sig);

  let event;

  try {
    // Verify webhook signature
    // req.body here MUST be the raw body from Stripe
    event = stripeClient.webhooks.constructEvent(req.body, sig, endpointSecret);
    console.log('✅ Signature verified successfully');
    console.log('📋 Event type:', event.type);
    console.log('🆔 Event ID:', event.id);
  } catch (err) {
    console.error(`❌ [Webhook] Signature verification failed: ${err.message}`);
    console.error('Stack:', err.stack);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      
      default:
        console.log(`ℹ️ [Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (err) {
    console.error(`❌ [Webhook] Error processing event: ${err.message}`);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

/**
 * Handle successful payment intent and trigger transfers for 3-way splits
 */
async function handlePaymentSuccess(paymentIntent) {
  const stripeClient = getStripe();
  const metadata = paymentIntent.metadata || {};

  console.log(`\n🔔 [Webhook] Payment Intent Succeeded: ${paymentIntent.id}`);
  
  // Check if this is a 3-way split that requires manual transfers
  if (metadata.requiresManualTransfers === 'true') {
    console.log('🏨 [3-WAY SPLIT] Triggering automatic transfers...');
    
    const latestChargeId = paymentIntent.latest_charge;
    if (!latestChargeId) {
      console.error('❌ [3-WAY SPLIT] No charge ID found on payment intent');
      return;
    }

    // ✅ NEW: Fetch the actual charge to get its REAL currency
    // This prevents errors if intent currency and charge currency differ
    let transferCurrency = metadata.currency || 'ils';
    try {
      const charge = await stripeClient.charges.retrieve(latestChargeId);
      transferCurrency = charge.currency;
      console.log(`💱 [3-WAY SPLIT] Using charge currency: ${transferCurrency.toUpperCase()}`);
    } catch (err) {
      console.warn(`⚠️ [3-WAY SPLIT] Could not fetch charge currency, falling back to: ${transferCurrency}`);
    }

    const { 
      vendorId, 
      hotelId, 
      vendorAmount, 
      hotelAmount
    } = metadata;

    // 1. Transfer to Vendor
    if (vendorId && parseFloat(vendorAmount) > 0) {
      try {
        const vendorTransfer = await stripeClient.transfers.create({
          amount: Math.round(parseFloat(vendorAmount) * 100),
          currency: transferCurrency.toLowerCase(),
          destination: vendorId,
          source_transaction: latestChargeId,
          description: `Transfer to Vendor for order ${paymentIntent.id}`,
          metadata: { paymentIntentId: paymentIntent.id }
        });
        console.log(`✅ [3-WAY SPLIT] Vendor transfer created: ${vendorTransfer.id} ($${vendorAmount})`);
      } catch (err) {
        console.error(`❌ [3-WAY SPLIT] Vendor transfer failed: ${err.message}`);
      }
    }

    // 2. Transfer to Hotel
    if (hotelId && parseFloat(hotelAmount) > 0) {
      try {
        const hotelTransfer = await stripeClient.transfers.create({
          amount: Math.round(parseFloat(hotelAmount) * 100),
          currency: transferCurrency.toLowerCase(),
          destination: hotelId,
          source_transaction: latestChargeId,
          description: `Transfer to Hotel for order ${paymentIntent.id}`,
          metadata: { paymentIntentId: paymentIntent.id }
        });
        console.log(`✅ [3-WAY SPLIT] Hotel transfer created: ${hotelTransfer.id} ($${hotelAmount})`);
      } catch (err) {
        console.error(`❌ [3-WAY SPLIT] Hotel transfer failed: ${err.message}`);
      }
    }

    
    console.log('🏨 [3-WAY SPLIT] All transfers processed\n');
  } else {
    console.log('ℹ️ [Webhook] Normal payment (2-way or other), no manual transfers needed.\n');
  }
}
