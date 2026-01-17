/**
 * Payment Split Calculator
 * 
 * Handles all 8 payment split scenarios based on shop configuration.
 * This is the single source of truth for payment calculations.
 */

/**
 * Calculate payment split based on shop configuration
 * 
 * @param {Object} order - Order details
 * @param {number} order.itemsTotal - Total price of items
 * @param {number} order.deliveryFee - Delivery fee
 * @param {number} order.tip - Tip amount
 * @param {number} order.cog - Total cost of goods
 * @param {Object} shopConfig - Shop payment configuration
 * @returns {Object} Split amounts for platform, hotel, and vendor
 */
function calculatePaymentSplit(order, shopConfig) {
  const paymentOptions = shopConfig['payment-options'] || shopConfig.paymentOptions;
  
  if (!paymentOptions) {
    throw new Error('Shop payment-options configuration is missing');
  }

  const model = paymentOptions.model;
  
  // Route to appropriate calculation based on model
  if (model === '3-way' && paymentOptions['hotel-id']) {
    return calculate3WaySplit(order, paymentOptions);
  } else if (model === 'cog-based') {
    return calculateCOGBasedSplit(order, paymentOptions);
  } else {
    return calculate2WaySplit(order, paymentOptions);
  }
}

/**
 * Calculate 2-way split (Platform + Vendor)
 * Used for: Standard, Delivery-Only, Vendor-All, High Commission
 */
function calculate2WaySplit(order, config) {
  const { itemsTotal, deliveryFee, tip } = order;
  
  const platformFee = config['platform-fee'] || 0;
  const vendorFee = config['vendor-fee'] || 1.0;
  
  // Validate fees add up to 1.0
  if (Math.abs(platformFee + vendorFee - 1.0) > 0.001) {
    throw new Error(`Platform and vendor fees must add up to 100% (got ${platformFee + vendorFee})`);
  }
  
  let platformAmount = 0;
  let vendorAmount = 0;
  
  // 1. Split items
  platformAmount += itemsTotal * platformFee;
  vendorAmount += itemsTotal * vendorFee;
  
  // 2. Delivery fee
  const deliveryDest = config['delivery-destination'] || 'platform';
  if (deliveryDest === 'platform') {
    platformAmount += deliveryFee;
  } else if (deliveryDest === 'vendor') {
    vendorAmount += deliveryFee;
  } else if (deliveryDest === 'split') {
    const split = config['delivery-split'] || { platform: 1.0, vendor: 0 };
    platformAmount += deliveryFee * split.platform;
    vendorAmount += deliveryFee * split.vendor;
  }
  
  // 3. Tip
  const tipDest = config['tip-destination'] || 'platform';
  if (tipDest === 'platform') {
    platformAmount += tip;
  } else if (tipDest === 'vendor') {
    vendorAmount += tip;
  } else if (tipDest === 'split') {
    const split = config['tip-split'] || { platform: 1.0, vendor: 0 };
    platformAmount += tip * split.platform;
    vendorAmount += tip * split.vendor;
  }
  
  return {
    platform: platformAmount,
    hotel: 0,
    vendor: vendorAmount,
    model: '2-way'
  };
}

/**
 * Calculate COG-based split (Platform + Vendor, commission on profit)
 * COG goes to vendor first, then split remaining profit
 */
function calculateCOGBasedSplit(order, config) {
  const { itemsTotal, deliveryFee, tip, cog = 0 } = order;
  
  const platformFee = config['platform-fee'] || 0;
  const vendorFee = config['vendor-fee'] || 1.0;
  
  // Validate fees
  if (Math.abs(platformFee + vendorFee - 1.0) > 0.001) {
    throw new Error(`Platform and vendor fees must add up to 100%`);
  }
  
  let platformAmount = 0;
  let vendorAmount = 0;
  
  // 1. COG goes to vendor first
  vendorAmount += cog;
  
  // 2. Split remaining profit
  const profit = itemsTotal - cog;
  platformAmount += profit * platformFee;
  vendorAmount += profit * vendorFee;
  
  // 3. Delivery fee
  const deliveryDest = config['delivery-destination'] || 'platform';
  if (deliveryDest === 'platform') {
    platformAmount += deliveryFee;
  } else if (deliveryDest === 'vendor') {
    vendorAmount += deliveryFee;
  }
  
  // 4. Tip
  const tipDest = config['tip-destination'] || 'platform';
  if (tipDest === 'platform') {
    platformAmount += tip;
  } else if (tipDest === 'vendor') {
    vendorAmount += tip;
  }
  
  return {
    platform: platformAmount,
    hotel: 0,
    vendor: vendorAmount,
    model: 'cog-based'
  };
}

/**
 * Calculate 3-way split (Platform + Hotel + Vendor)
 * Requires manual Stripe transfers
 */
function calculate3WaySplit(order, config) {
  const { itemsTotal, deliveryFee, tip, cog = 0 } = order;
  
  const platformFee = config['platform-fee'] || 0;
  const hotelFee = config['hotel-fee'] || 0;
  const vendorFee = config['vendor-fee'] || 1.0;
  
  // Validate fees
  const totalFees = platformFee + hotelFee + vendorFee;
  if (Math.abs(totalFees - 1.0) > 0.001) {
    throw new Error(`All fees must add up to 100% (got ${totalFees})`);
  }
  
  let platformAmount = 0;
  let hotelAmount = 0;
  let vendorAmount = 0;
  
  // 1. COG goes to vendor first
  vendorAmount += cog;
  
  // 2. Split remaining profit 3 ways
  const profit = itemsTotal - cog;
  platformAmount += profit * platformFee;
  hotelAmount += profit * hotelFee;
  vendorAmount += profit * vendorFee;
  
  // 3. Delivery fee
  const deliveryDest = config['delivery-destination'] || 'platform';
  if (deliveryDest === 'platform') {
    platformAmount += deliveryFee;
  } else if (deliveryDest === 'hotel') {
    hotelAmount += deliveryFee;
  } else if (deliveryDest === 'vendor') {
    vendorAmount += deliveryFee;
  } else if (deliveryDest === 'split') {
    const split = config['delivery-split'] || { platform: 1.0, hotel: 0, vendor: 0 };
    platformAmount += deliveryFee * (split.platform || 0);
    hotelAmount += deliveryFee * (split.hotel || 0);
    vendorAmount += deliveryFee * (split.vendor || 0);
  }
  
  // 4. Tip
  const tipDest = config['tip-destination'] || 'platform';
  if (tipDest === 'platform') {
    platformAmount += tip;
  } else if (tipDest === 'hotel') {
    hotelAmount += tip;
  } else if (tipDest === 'vendor') {
    vendorAmount += tip;
  } else if (tipDest === 'split') {
    const split = config['tip-split'] || { platform: 1.0, hotel: 0, vendor: 0 };
    platformAmount += tip * (split.platform || 0);
    hotelAmount += tip * (split.hotel || 0);
    vendorAmount += tip * (split.vendor || 0);
  }
  
  return {
    platform: platformAmount,
    hotel: hotelAmount,
    vendor: vendorAmount,
    model: '3-way'
  };
}

/**
 * Calculate Stripe fee split (proportional to what each party receives)
 * 
 * @param {Object} splits - Platform, hotel, vendor amounts
 * @param {number} totalAmount - Total order amount
 * @returns {Object} Stripe fee for each party
 */
function calculateStripeFees(splits, totalAmount, currency = 'ils') {
  // Stripe charges 2.9% + fixed fee
  // Standard fees (Major units: Dollars/Shekels):
  // USD: 0.029 + $0.30
  // ILS: 0.029 + 1.20 ILS
  
  const percentageFee = totalAmount * 0.029;
  const fixedFee = currency.toLowerCase() === 'usd' ? 0.30 : 1.20;
  const totalStripeFee = percentageFee + fixedFee;
  
  // Calculate each party's share of total
  const platformShare = splits.platform / totalAmount;
  const hotelShare = splits.hotel / totalAmount;
  const vendorShare = splits.vendor / totalAmount;
  
  // Split Stripe fees proportionally
  return {
    platform: totalStripeFee * platformShare,
    hotel: totalStripeFee * hotelShare,
    vendor: totalStripeFee * vendorShare,
    total: totalStripeFee
  };
}

/**
 * Calculate final amounts after Stripe fees
 * Platform gets vendor's Stripe fee added (pre-deduction model)
 */
function calculateFinalAmounts(splits, stripeFees) {
  return {
    platform: Math.max(0, splits.platform - stripeFees.platform),
    hotel: Math.max(0, splits.hotel - stripeFees.hotel),
    vendor: Math.max(0, splits.vendor - stripeFees.vendor),
    stripeFeeTotal: stripeFees.total
  };
}

/**
 * Main function: Calculate complete payment breakdown
 */
function calculateCompletePaymentBreakdown(order, shopConfig, currency = 'ils') {
  // 1. Calculate base splits
  const splits = calculatePaymentSplit(order, shopConfig);
  
  // 2. Calculate Stripe fees
  const totalAmount = order.itemsTotal + order.deliveryFee + order.tip;
  const stripeFees = calculateStripeFees(splits, totalAmount, currency);
  
  // 3. Calculate final amounts
  const finalAmounts = calculateFinalAmounts(splits, stripeFees);
  
  return {
    splits: splits,
    stripeFees: stripeFees,
    finalAmounts: finalAmounts,
    breakdown: {
      itemsTotal: order.itemsTotal,
      cog: order.cog || 0,
      profit: order.itemsTotal - (order.cog || 0),
      deliveryFee: order.deliveryFee,
      tip: order.tip,
      total: totalAmount
    }
  };
}

module.exports = {
  calculatePaymentSplit,
  calculate2WaySplit,
  calculateCOGBasedSplit,
  calculate3WaySplit,
  calculateStripeFees,
  calculateFinalAmounts,
  calculateCompletePaymentBreakdown
};
