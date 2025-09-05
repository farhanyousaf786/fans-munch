// server/controllers/airwallexController.js
// Simplified: only health and testPayment endpoints to verify server connectivity



// Test payment endpoint (migrated from paymentController)
exports.testPayment = async (req, res) => {
  try {
    // Fake processing delay to simulate server work
    await new Promise((resolve) => setTimeout(resolve, 300));

    const { amount, currency } = req.body || {};
    return res.status(200).json({
      success: true,
      message: '✅ We got your payment. Processing your order now... (test mode)',
      amount: amount ?? 0,
      currency: currency ?? 'USD',
      serverTime: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Airwallex] testPayment error:', err?.message || err);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
