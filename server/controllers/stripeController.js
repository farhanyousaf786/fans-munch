const stripe = require('stripe');
const paymentSplitService = require('../services/paymentSplitService');

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
    
    console.log('\n' + '='.repeat(60));
    console.log('📥 [SERVER] Received Payment Intent Request');
    console.log('='.repeat(60));
    
    // Get request data
    const { 
      amount,
      currency = 'ils',
      shopConfig,           // ✅ NEW: Shop configuration with payment-options
      cartItems = [],       // ✅ NEW: Cart items with COG
      deliveryFee = 0,
      tipAmount = 0
    } = req.body;
    
    console.log(`💰 Total Amount: ${amount} ${currency.toUpperCase()}`);
    console.log(`🚚 Delivery Fee: ${deliveryFee}`);
    console.log(`💵 Tip: ${tipAmount}`);
    console.log(`🛒 Cart Items: ${cartItems.length}`);
    console.log('='.repeat(60));
    
    // 📋 NEW: Show Raw Config from Firebase
    const rawOpts = shopConfig?.['payment-options'];
    if (rawOpts) {
      console.log('📋 [SHOP CONFIG FROM FIREBASE]');
      console.log(`  Model: ${rawOpts.model.toUpperCase()}`);
      console.log(`  Platform %: ${(rawOpts['platform-fee'] * 100).toFixed(1)}%`);
      if (rawOpts['hotel-fee'] !== undefined) console.log(`  Hotel %:    ${(rawOpts['hotel-fee'] * 100).toFixed(1)}%`);
      console.log(`  Vendor %:   ${(rawOpts['vendor-fee'] * 100).toFixed(1)}%`);
      console.log(`  Vendor ID:  ${rawOpts['vendor-id'] || 'None'}`);
      console.log(`  Hotel ID:   ${rawOpts['hotel-id'] || 'None'}`);
      console.log('='.repeat(60) + '\n');
    }
    
    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }
    
    if (!shopConfig || !shopConfig['payment-options']) {
      return res.status(400).json({
        success: false,
        error: 'Select location so we know where to deliver'
      });
    }

    // Convert amount to cents
    const amountInCents = Math.round(amount * 100);
    
    // ✅ Calculate COG from cart items
    const totalCOG = cartItems.reduce((sum, item) => {
      const itemCOG = (item.costOfGoods || 0) * (item.quantity || 1);
      return sum + itemCOG;
    }, 0);

    const getSymbol = (curr) => curr?.toLowerCase() === 'ils' ? '₪' : '$';
    const sym = getSymbol(currency);
    
    const itemsTotal = cartItems.reduce((sum, item) => {
      const itemPrice = (item.price || 0) * (item.quantity || 1);
      return sum + itemPrice;
    }, 0);
    
    console.log('📦 [ORDER BREAKDOWN]');
    console.log(`Items Total: ${sym}${itemsTotal.toFixed(2)}`);
    console.log(`COG Total: ${sym}${totalCOG.toFixed(2)}`);
    console.log(`Profit: ${sym}${(itemsTotal - totalCOG).toFixed(2)}`);
    console.log(`Delivery: ${sym}${deliveryFee.toFixed(2)}`);
    console.log(`Tip: ${sym}${tipAmount.toFixed(2)}\n`);
    
    // ✅ Use payment split service to calculate splits
    const order = {
      itemsTotal,
      deliveryFee,
      tip: tipAmount,
      cog: totalCOG
    };
    
    const paymentBreakdown = paymentSplitService.calculateCompletePaymentBreakdown(order, shopConfig, currency);
    
    console.log('💸 [PAYMENT SPLIT CALCULATION]');
    console.log(`Model: ${paymentBreakdown.splits.model.toUpperCase()}`);
    console.log('-'.repeat(30));
    
    // Explicit COG Calculation Log
    if (order.cog > 0) {
      console.log('COMMISSION CALCULATION (Profit-Based):');
      console.log(`  Items Total:   ${sym}${order.itemsTotal.toFixed(2)}`);
      console.log(`  Minus COG:    -${sym}${order.cog.toFixed(2)}`);
      console.log(`  Gross Profit:  ${sym}${(order.itemsTotal - order.cog).toFixed(2)}`);
      console.log(`  Applied Rates:`);
      const opts = shopConfig['payment-options'];
      console.log(`    Platform: ${(opts['platform-fee'] * 100).toFixed(0)}%`);
      if (opts['hotel-fee']) console.log(`    Hotel:    ${(opts['hotel-fee'] * 100).toFixed(0)}%`);
      console.log(`    Vendor:   ${(opts['vendor-fee'] * 100).toFixed(0)}%`);
      console.log('-'.repeat(30));
    }

    console.log('RAW SPLITS (Excluding Fees):');
    console.log(`  Platform: ${sym}${paymentBreakdown.splits.platform.toFixed(2)}`);
    console.log(`  Hotel:    ${sym}${paymentBreakdown.splits.hotel.toFixed(2)}`);
    console.log(`  Vendor:   ${sym}${paymentBreakdown.splits.vendor.toFixed(2)} (Includes COG if applicable)`);
    console.log('-'.repeat(30));
    console.log('STRIPE FEES DEDUCTION (Proportional):');
    console.log(`  Total Fee: ${sym}${paymentBreakdown.stripeFees.total.toFixed(2)}`);
    console.log(`  Platform Share: -${sym}${paymentBreakdown.stripeFees.platform.toFixed(2)}`);
    console.log(`  Hotel Share:    -${sym}${paymentBreakdown.stripeFees.hotel.toFixed(2)}`);
    console.log(`  Vendor Share:   -${sym}${paymentBreakdown.stripeFees.vendor.toFixed(2)}`);
    console.log('-'.repeat(30));
    console.log('FINAL AMOUNTS (To be paid out):');
    console.log(`  Platform: ${sym}${paymentBreakdown.finalAmounts.platform.toFixed(2)}`);
    console.log(`  Hotel:    ${sym}${paymentBreakdown.finalAmounts.hotel.toFixed(2)}`);
    console.log(`  Vendor:   ${sym}${paymentBreakdown.finalAmounts.vendor.toFixed(2)}`);
    console.log('='.repeat(60) + '\n');
    
    // Get payment options
    const paymentOptions = shopConfig['payment-options'];
    const vendorId = paymentOptions['vendor-id'];
    const hotelId = paymentOptions['hotel-id'];
    const model = paymentOptions.model;
    
    // Build payment intent data
    const paymentIntentData = {
      amount: amountInCents,
      currency: currency.toLowerCase(),
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        source: 'fans-munch-app',
        timestamp: new Date().toISOString(),
        model: model,
        platformAmount: paymentBreakdown.finalAmounts.platform.toFixed(2),
        hotelAmount: paymentBreakdown.finalAmounts.hotel.toFixed(2),
        vendorAmount: paymentBreakdown.finalAmounts.vendor.toFixed(2),
        stripeFeeTotal: paymentBreakdown.stripeFees.total.toFixed(2)
      },
    };
    
    // ✅ Handle payment routing based on model
    if (model === '3-way' && hotelId) {
      // 3-way split requires manual transfers (done after payment succeeds)
      console.log('🏨 [3-WAY SPLIT] Manual transfers will be created after payment');
      paymentIntentData.metadata.requiresManualTransfers = 'true';
      paymentIntentData.metadata.vendorId = vendorId;
      paymentIntentData.metadata.hotelId = hotelId;
      
    } else if (vendorId) {
      // 2-way split (automatic transfer)
      const platformFeeInCents = Math.round(paymentBreakdown.finalAmounts.platform * 100);
      
      paymentIntentData.application_fee_amount = platformFeeInCents;
      paymentIntentData.transfer_data = {
        destination: vendorId,
      };
      paymentIntentData.metadata.vendorId = vendorId;
      
      console.log('🏪 [2-WAY SPLIT] Automatic transfer configured');
      console.log(`Platform keeps: $${paymentBreakdown.finalAmounts.platform.toFixed(2)}`);
      console.log(`Vendor receives: $${paymentBreakdown.finalAmounts.vendor.toFixed(2)}\n`);
    }
    
    // Create payment intent
    const paymentIntent = await stripeClient.paymentIntents.create(paymentIntentData);
    
    console.log('[Stripe] Payment intent created:', paymentIntent.id);
    console.log('='.repeat(60) + '\n');
    
    return res.json({
      success: true,
      intentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      mode: 'stripe',
      paymentBreakdown: {
        platform: paymentBreakdown.finalAmounts.platform,
        hotel: paymentBreakdown.finalAmounts.hotel,
        vendor: paymentBreakdown.finalAmounts.vendor,
        stripeFee: paymentBreakdown.stripeFees.total
      }
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
