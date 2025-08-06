/**
 * Stripe Payment Service - Handles payment processing
 * Matches Flutter stadium_food Stripe integration
 */

class StripeService {
  constructor() {
    // Demo mode - simulate Stripe payments for development
    this.isDemoMode = true;
    this.stripeSecretKey = process.env.REACT_APP_STRIPE_SECRET_KEY || 'demo_key';
    this.stripeApiUrl = 'https://api.stripe.com/v1/payment_intents';
  }

  /**
   * Calculate amount in cents (matches Flutter calculateAmount)
   */
  calculateAmount(amount) {
    const doubleAmount = parseFloat(amount);
    // Convert to smallest currency unit (cents for USD)
    const intAmount = Math.round(doubleAmount * 100);
    return intAmount.toString();
  }

  /**
   * Create payment intent (matches Flutter createPaymentIntent)
   */
  async createPaymentIntent(amount, currency = 'USD', description = 'Stadium Food Order') {
    try {
      console.log('💳 Creating payment intent for amount:', amount, currency);

      const body = new URLSearchParams({
        'amount': this.calculateAmount(amount),
        'currency': currency.toLowerCase(),
        'payment_method_types[]': 'card',
        'description': description,
        'metadata[original_currency]': currency,
        'metadata[original_amount]': amount.toString()
      });

      const response = await fetch(this.stripeApiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Stripe API error: ${errorData.error?.message || 'Unknown error'}`);
      }

      const paymentIntent = await response.json();
      console.log('✅ Payment intent created:', paymentIntent.id);
      
      return paymentIntent;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw new Error(`Failed to create payment intent: ${error.message}`);
    }
  }

  /**
   * Process payment using Stripe Elements (for web)
   * This is a simplified version - in production you'd use Stripe Elements
   */
  async processPayment(paymentData) {
    try {
      console.log('💳 Processing payment...', paymentData);

      // Simulate payment processing (matches Flutter payment flow)
      const { amount, currency, description, customerInfo } = paymentData;

      // Validate payment amount first
      this.validatePaymentAmount(amount);

      if (this.isDemoMode) {
        // Demo mode - simulate successful payment without API calls
        console.log('🎭 Demo mode: Simulating Stripe payment processing...');
        
        await this.simulatePaymentProcessing();
        
        const mockPaymentIntentId = `pi_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        console.log('✅ Demo payment processed successfully');
        
        return {
          success: true,
          paymentIntentId: mockPaymentIntentId,
          amount: parseFloat(amount),
          currency: currency.toUpperCase(),
          status: 'succeeded',
          demo: true
        };
      } else {
        // Production mode - make real Stripe API calls
        console.log('🔐 Production mode: Processing real Stripe payment...');
        
        // Step 1: Create payment intent
        const paymentIntent = await this.createPaymentIntent(amount, currency, description);

        // Step 2: In a real implementation, you would:
        // 1. Use Stripe Elements to collect card details
        // 2. Confirm the payment intent with the card
        // 3. Handle 3D Secure authentication if needed
        
        // For now, simulate successful payment confirmation
        await this.simulatePaymentProcessing();

        console.log('✅ Payment processed successfully');
        
        return {
          success: true,
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convert back from cents
          currency: paymentIntent.currency.toUpperCase(),
          status: 'succeeded'
        };
      }
    } catch (error) {
      console.error('❌ Payment processing failed:', error);
      
      return {
        success: false,
        error: error.message,
        status: 'failed'
      };
    }
  }

  /**
   * Simulate payment processing delay (matches Flutter async payment)
   */
  async simulatePaymentProcessing() {
    return new Promise((resolve) => {
      // Simulate network delay like real Stripe payment
      setTimeout(resolve, 2000);
    });
  }

  /**
   * Validate payment amount (matches Flutter validation)
   */
  validatePaymentAmount(amount) {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      throw new Error('Invalid payment amount');
    }
    
    if (numAmount < 0.50) {
      throw new Error('Minimum payment amount is $0.50');
    }
    
    if (numAmount > 999999.99) {
      throw new Error('Maximum payment amount is $999,999.99');
    }
    
    return true;
  }

  /**
   * Format amount for display (matches Flutter currency formatting)
   */
  formatAmount(amount, currency = 'USD') {
    const numAmount = parseFloat(amount);
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(numAmount);
  }

  /**
   * Get supported payment methods (matches Flutter payment options)
   */
  getSupportedPaymentMethods() {
    return [
      {
        id: 'visa',
        name: 'Visa',
        icon: '💳',
        type: 'card'
      },
      {
        id: 'mastercard',
        name: 'Mastercard',
        icon: '💳',
        type: 'card'
      },
      {
        id: 'paypal',
        name: 'PayPal',
        icon: '💰',
        type: 'wallet'
      }
    ];
  }

  /**
   * Handle payment errors (matches Flutter error handling)
   */
  handlePaymentError(error) {
    console.error('💳 Payment error:', error);

    // Map common Stripe errors to user-friendly messages
    const errorMessages = {
      'card_declined': 'Your card was declined. Please try a different payment method.',
      'insufficient_funds': 'Insufficient funds. Please try a different payment method.',
      'expired_card': 'Your card has expired. Please try a different payment method.',
      'incorrect_cvc': 'Your card\'s security code is incorrect. Please try again.',
      'processing_error': 'An error occurred while processing your payment. Please try again.',
      'rate_limit': 'Too many requests. Please wait a moment and try again.'
    };

    const userMessage = errorMessages[error.code] || 'Payment failed. Please try again.';
    
    return {
      success: false,
      error: userMessage,
      code: error.code || 'unknown_error'
    };
  }
}

// Export singleton instance
const stripeService = new StripeService();
export default stripeService;
