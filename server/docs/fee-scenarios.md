# Payment Fee Scenarios Documentation

## Overview
This document describes all 8 possible payment split scenarios supported by the Fans Munch platform. The system uses a **single flexible function** that reads the shop's Firebase configuration and automatically calculates the correct split.

---

## Base Order Example
All scenarios use this example order:
- **Items Total**: $80
- **Delivery Fee**: $15
- **Tip**: $5
- **Total**: $100
- **COG** (Cost of Goods): $20 (when applicable)

---

## Scenario 1: Standard 2-Way Split (5% Commission)

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "2-way",
    "platform-fee": 0.05,
    "vendor-fee": 0.95,
    "hotel-fee": 0,
    "delivery-destination": "platform",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": null
  }
}
```

### Money Split:
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Delivery + Tip + 5% of items + Vendor Stripe share | **$25.66** |
| **Vendor** | 95% of items - Vendor Stripe share | **$73.57** |
| **Hotel** | Nothing | **$0** |

### Stripe Accounts Needed: **2**
- Platform main account
- Vendor connected account

### Use Case:
- Standard marketplace model
- Platform provides marketing + delivery
- Balanced revenue share

---

## Scenario 2: Delivery-Only Model

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "2-way",
    "platform-fee": 0,
    "vendor-fee": 1.0,
    "hotel-fee": 0,
    "delivery-destination": "platform",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": null
  }
}
```

### Money Split:
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Delivery + Tip + Vendor Stripe share | **$22.56** |
| **Vendor** | 100% of items - Vendor Stripe share | **$77.44** |
| **Hotel** | Nothing | **$0** |

### Stripe Accounts Needed: **2**

### Use Case:
- Premium vendors who want full product revenue
- Platform acts as pure delivery service
- Simple, transparent pricing

---

## Scenario 3: Vendor Gets Everything

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "2-way",
    "platform-fee": 0,
    "vendor-fee": 1.0,
    "hotel-fee": 0,
    "delivery-destination": "vendor",
    "tip-destination": "vendor",
    "vendor-id": "acct_vendor123",
    "hotel-id": null
  }
}
```

### Money Split:
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Platform Stripe share only | **$3.07** |
| **Vendor** | Items + Delivery + Tip - Vendor Stripe share | **$96.93** |
| **Hotel** | Nothing | **$0** |

### Stripe Accounts Needed: **2**

### Use Case:
- Vendor provides own delivery
- Platform only provides ordering infrastructure
- Minimal platform involvement

---

## Scenario 4: COG-Based Commission (2-Way Split on Profit)

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "cog-based",
    "platform-fee": 0.12,
    "vendor-fee": 0.88,
    "delivery-destination": "platform",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": null
  }
}
```

### Money Split (with COG = $20):
| Party | Gets | Calculation | Amount |
|-------|------|-------------|--------|
| **Platform** | Delivery + Tip + 12% of profit + Vendor Stripe share | $15 + $5 + ($60 × 0.12) + $2.33 | **$28.66** |
| **Vendor** | COG + 88% of profit - Vendor Stripe share | $20 + ($60 × 0.88) - $2.33 | **$70.47** |

**Note:** Profit = Items Total - COG = $80 - $20 = $60

### Stripe Accounts Needed: **2**
- Platform main account
- Vendor connected account

### Use Case:
- High COG products (food, merchandise)
- Commission on profit only (fair for both parties)
- Platform takes % of margin, not revenue
- **No hotel/venue partnership** - just COG-aware commission

---

## Scenario 5: True 3-Way Split

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "3-way",
    "platform-fee": 0,
    "vendor-fee": 0.88,
    "hotel-fee": 0.12,
    "delivery-destination": "platform",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": "acct_hotel456"
  }
}
```

### Money Split (with COG = $20):
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Delivery + Tip | **$20.00** |
| **Hotel** | 12% of ($80 - $20) | **$7.20** |
| **Vendor** | COG + 88% of ($80 - $20) | **$72.80** |

### Stripe Accounts Needed: **3**
- Platform main account
- Hotel connected account
- Vendor connected account

### Implementation: **Manual Transfers**
```javascript
// 1. Platform receives $100
// 2. Transfer $7.20 to hotel account
// 3. Transfer $72.80 to vendor account
// 4. Platform keeps $20
```

### Use Case:
- Stadium/venue partnerships
- Venue owner (hotel) gets separate commission
- Complex revenue sharing agreements

---

## Scenario 6: 3-Way with Hotel Getting Delivery

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "3-way",
    "platform-fee": 0,
    "vendor-fee": 0.88,
    "hotel-fee": 0.12,
    "delivery-destination": "hotel",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": "acct_hotel456"
  }
}
```

### Money Split:
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Tip only | **$5.00** |
| **Hotel** | Delivery + 12% of profit | **$22.20** |
| **Vendor** | COG + 88% of profit | **$72.80** |

### Stripe Accounts Needed: **3**

### Use Case:
- Hotel provides delivery infrastructure
- Platform provides ordering system only
- Venue-centric model

---

## Scenario 7: 3-Way with Split Fees

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "3-way",
    "platform-fee": 0,
    "vendor-fee": 0.88,
    "hotel-fee": 0.12,
    "delivery-destination": "split",
    "delivery-split": {
      "platform": 0.5,
      "hotel": 0.5,
      "vendor": 0
    },
    "tip-destination": "split",
    "tip-split": {
      "platform": 0.4,
      "hotel": 0.3,
      "vendor": 0.3
    },
    "vendor-id": "acct_vendor123",
    "hotel-id": "acct_hotel456"
  }
}
```

### Money Split:
| Party | Gets | Calculation | Amount |
|-------|------|-------------|--------|
| **Platform** | 50% delivery + 40% tip | ($15 × 0.5) + ($5 × 0.4) | **$9.50** |
| **Hotel** | 50% delivery + 30% tip + 12% profit | ($15 × 0.5) + ($5 × 0.3) + $7.20 | **$16.20** |
| **Vendor** | 30% tip + COG + 88% profit | ($5 × 0.3) + $20 + $52.80 | **$74.30** |

### Stripe Accounts Needed: **3**

### Use Case:
- Complex partnerships with shared responsibilities
- Multiple parties provide delivery/service
- Maximum flexibility

---

## Scenario 8: High Commission (15%)

### Firebase Configuration:
```json
{
  "payment-options": {
    "model": "2-way",
    "platform-fee": 0.15,
    "vendor-fee": 0.85,
    "hotel-fee": 0,
    "delivery-destination": "platform",
    "tip-destination": "platform",
    "vendor-id": "acct_vendor123",
    "hotel-id": null
  }
}
```

### Money Split:
| Party | Gets | Amount |
|-------|------|--------|
| **Platform** | Delivery + Tip + 15% items + Vendor Stripe share | **$32.74** |
| **Vendor** | 85% items - Vendor Stripe share | **$66.28** |
| **Hotel** | Nothing | **$0** |

### Stripe Accounts Needed: **2**

### Use Case:
- Platform provides significant value (marketing, traffic, etc.)
- High-traffic venues
- Exclusive partnerships

---

## Summary Comparison Table

| Scenario | Model | Platform | Hotel | Vendor | Accounts | Best For |
|----------|-------|----------|-------|--------|----------|----------|
| **1** | 2-way (5%) | $25.66 | $0 | $73.57 | 2 | Standard marketplace |
| **2** | Delivery-Only | $22.56 | $0 | $77.44 | 2 | Premium vendors |
| **3** | Vendor All | $3.07 | $0 | $96.93 | 2 | Vendor-managed delivery |
| **4** | COG-Based | $28.66 | $0 | $70.47 | 2 | High COG products |
| **5** | 3-Way | $20.00 | $7.20 | $72.80 | 3 | Stadium partnerships |
| **6** | 3-Way (Hotel Delivery) | $5.00 | $22.20 | $72.80 | 3 | Venue-centric |
| **7** | 3-Way (Split Fees) | $9.50 | $16.20 | $74.30 | 3 | Complex partnerships |
| **8** | High Commission | $32.74 | $0 | $66.28 | 2 | High-value platform |

---

## Implementation

### Single Flexible Function
The system uses **ONE function** that reads the shop configuration and automatically calculates the correct split:

```javascript
async function calculatePaymentSplit(order, shopConfig) {
  const model = shopConfig['payment-options'].model;
  
  // Automatically route to correct logic based on model
  if (model === '3-way' && shopConfig['payment-options']['hotel-id']) {
    return calculate3WaySplit(order, shopConfig);
  } else if (model === 'cog-based') {
    return calculateCOGBasedSplit(order, shopConfig);
  } else {
    return calculate2WaySplit(order, shopConfig);
  }
}
```

### No Need for 8 Separate Functions
The function adapts based on:
- `model` field
- `platform-fee`, `vendor-fee`, `hotel-fee` rates
- `delivery-destination` and `tip-destination` settings
- Presence of `hotel-id` (determines if 3-way split is possible)

---

## Stripe Fee Handling

All scenarios use **proportional Stripe fee splitting**:

```
Stripe charges: 2.9% + 30¢ per transaction

Each party pays Stripe fees proportional to what they receive:
- If Platform gets 25% of order → Platform pays 25% of Stripe fee
- If Vendor gets 75% of order → Vendor pays 75% of Stripe fee
```

This ensures fair distribution of transaction costs.

---

## Product COG (Cost of Goods)

### Where It's Stored:
```javascript
// In products collection:
{
  "id": "pizza_001",
  "name": "Margherita Pizza",
  "price": 50.00,
  "costOfGoods": 15.00,  // ← Stored per product
  "hasCOG": true
}
```

### How It's Used:
- **Scenarios 1-3, 8**: COG is ignored (commission on full price)
- **Scenario 4 (cog-based)**: COG deducted first, commission on profit only
- **Scenarios 5-7 (3-way)**: COG deducted first, commission on profit only

### If COG = 0:
The system treats it as "no COG" and splits the full item price according to the configured rates.

---

## Configuration Validation

The system validates:
1. ✅ Fees add up to 100% (`platform-fee + vendor-fee + hotel-fee = 1.0`)
2. ✅ Required accounts exist (vendor-id always required, hotel-id only for 3-way)
3. ✅ Valid destination values ("platform", "vendor", "hotel", or "split")
4. ✅ Split ratios add up to 100% (if using "split" destination)

---

## Migration Path

### Current Code → New System:
1. **Current behavior** = Scenario 2 (Delivery-Only)
2. Add `payment-options` to shops collection
3. System automatically detects and uses correct logic
4. No code changes needed for existing shops (defaults to current behavior)

---

## Backend/Dashboard Implementation Guide

### For Backend Developers: How to Add Payment Configuration to Shops

This section explains how to create admin functions/APIs to configure payment options for shops in Firebase.

---

### 1. Create Shop with Payment Configuration

#### **API Endpoint:**
```javascript
POST /api/admin/shops/create
```

#### **Request Body:**
```json
{
  "name": "Stadium Pizza",
  "stadiumId": "stadium_001",
  "deliveryFee": 15,
  "paymentConfig": {
    "model": "cog-based",
    "platformFee": 0.12,
    "vendorFee": 0.88,
    "hotelFee": 0,
    "deliveryDestination": "platform",
    "tipDestination": "platform",
    "vendorId": "acct_vendor123",
    "hotelId": null
  }
}
```

#### **Backend Function:**
```javascript
// In shopController.js or admin API

const { db } = require('../config/firebase');
const { collection, addDoc, Timestamp } = require('firebase/firestore');

exports.createShop = async (req, res) => {
  try {
    const { name, stadiumId, deliveryFee, paymentConfig } = req.body;
    
    // Validate payment configuration
    const validation = validatePaymentConfig(paymentConfig);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    // Create shop document
    const shopData = {
      name,
      stadiumId,
      deliveryFee: deliveryFee || 0,
      deliveryFeeCurrency: 'ILS',
      shopAvailability: true,
      
      // Payment configuration
      'payment-options': {
        model: paymentConfig.model,
        'platform-fee': paymentConfig.platformFee,
        'vendor-fee': paymentConfig.vendorFee,
        'hotel-fee': paymentConfig.hotelFee || 0,
        'delivery-destination': paymentConfig.deliveryDestination,
        'tip-destination': paymentConfig.tipDestination,
        'delivery-split': paymentConfig.deliverySplit || null,
        'tip-split': paymentConfig.tipSplit || null,
        'vendor-id': paymentConfig.vendorId,
        'hotel-id': paymentConfig.hotelId || null
      },
      
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };
    
    const docRef = await addDoc(collection(db, 'shops'), shopData);
    
    return res.json({
      success: true,
      shopId: docRef.id,
      message: 'Shop created successfully'
    });
  } catch (error) {
    console.error('Error creating shop:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

### 2. Update Existing Shop Payment Configuration

#### **API Endpoint:**
```javascript
PUT /api/admin/shops/:shopId/payment-config
```

#### **Request Body:**
```json
{
  "model": "3-way",
  "platformFee": 0,
  "vendorFee": 0.88,
  "hotelFee": 0.12,
  "deliveryDestination": "platform",
  "tipDestination": "platform",
  "vendorId": "acct_vendor123",
  "hotelId": "acct_hotel456"
}
```

#### **Backend Function:**
```javascript
const { doc, updateDoc, Timestamp } = require('firebase/firestore');

exports.updateShopPaymentConfig = async (req, res) => {
  try {
    const { shopId } = req.params;
    const paymentConfig = req.body;
    
    // Validate
    const validation = validatePaymentConfig(paymentConfig);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    // Update shop
    const shopRef = doc(db, 'shops', shopId);
    await updateDoc(shopRef, {
      'payment-options': {
        model: paymentConfig.model,
        'platform-fee': paymentConfig.platformFee,
        'vendor-fee': paymentConfig.vendorFee,
        'hotel-fee': paymentConfig.hotelFee || 0,
        'delivery-destination': paymentConfig.deliveryDestination,
        'tip-destination': paymentConfig.tipDestination,
        'delivery-split': paymentConfig.deliverySplit || null,
        'tip-split': paymentConfig.tipSplit || null,
        'vendor-id': paymentConfig.vendorId,
        'hotel-id': paymentConfig.hotelId || null
      },
      updatedAt: Timestamp.now()
    });
    
    return res.json({
      success: true,
      message: 'Payment configuration updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment config:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
```

---

### 3. Validation Function

```javascript
function validatePaymentConfig(config) {
  // Check required fields
  if (!config.model) {
    return { valid: false, error: 'Model is required' };
  }
  
  // Validate model
  const validModels = ['2-way', 'cog-based', '3-way'];
  if (!validModels.includes(config.model)) {
    return { valid: false, error: `Invalid model. Must be one of: ${validModels.join(', ')}` };
  }
  
  // Validate fees add up to 100%
  const totalFees = (config.platformFee || 0) + (config.vendorFee || 0) + (config.hotelFee || 0);
  if (Math.abs(totalFees - 1.0) > 0.001) {
    return { valid: false, error: `Fees must add up to 100% (got ${totalFees * 100}%)` };
  }
  
  // Validate vendor ID
  if (!config.vendorId) {
    return { valid: false, error: 'Vendor ID is required' };
  }
  
  // Validate hotel ID for 3-way model
  if (config.model === '3-way' && !config.hotelId) {
    return { valid: false, error: 'Hotel ID is required for 3-way model' };
  }
  
  // Validate destinations
  const validDestinations = ['platform', 'vendor', 'hotel', 'split'];
  if (!validDestinations.includes(config.deliveryDestination)) {
    return { valid: false, error: 'Invalid delivery destination' };
  }
  if (!validDestinations.includes(config.tipDestination)) {
    return { valid: false, error: 'Invalid tip destination' };
  }
  
  // Validate split ratios if using "split"
  if (config.deliveryDestination === 'split') {
    if (!config.deliverySplit) {
      return { valid: false, error: 'Delivery split ratios required when using split destination' };
    }
    const splitTotal = (config.deliverySplit.platform || 0) + 
                       (config.deliverySplit.hotel || 0) + 
                       (config.deliverySplit.vendor || 0);
    if (Math.abs(splitTotal - 1.0) > 0.001) {
      return { valid: false, error: 'Delivery split ratios must add up to 100%' };
    }
  }
  
  return { valid: true };
}
```

---

### 4. Dashboard UI Example (React)

```javascript
// ShopPaymentConfigForm.jsx

import React, { useState } from 'react';

const ShopPaymentConfigForm = ({ shopId, onSave }) => {
  const [config, setConfig] = useState({
    model: '2-way',
    platformFee: 0.05,
    vendorFee: 0.95,
    hotelFee: 0,
    deliveryDestination: 'platform',
    tipDestination: 'platform',
    vendorId: '',
    hotelId: null
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await fetch(`/api/admin/shops/${shopId}/payment-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('Payment configuration saved!');
        onSave();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (error) {
      alert('Error saving configuration');
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <h3>Payment Configuration</h3>
      
      {/* Model Selection */}
      <div>
        <label>Payment Model:</label>
        <select value={config.model} onChange={(e) => setConfig({...config, model: e.target.value})}>
          <option value="2-way">2-Way Split</option>
          <option value="cog-based">COG-Based</option>
          <option value="3-way">3-Way Split</option>
        </select>
      </div>
      
      {/* Commission Rates */}
      <div>
        <label>Platform Fee (%):</label>
        <input 
          type="number" 
          step="0.01" 
          value={config.platformFee * 100} 
          onChange={(e) => setConfig({...config, platformFee: parseFloat(e.target.value) / 100})}
        />
      </div>
      
      <div>
        <label>Vendor Fee (%):</label>
        <input 
          type="number" 
          step="0.01" 
          value={config.vendorFee * 100} 
          onChange={(e) => setConfig({...config, vendorFee: parseFloat(e.target.value) / 100})}
        />
      </div>
      
      {config.model === '3-way' && (
        <div>
          <label>Hotel Fee (%):</label>
          <input 
            type="number" 
            step="0.01" 
            value={config.hotelFee * 100} 
            onChange={(e) => setConfig({...config, hotelFee: parseFloat(e.target.value) / 100})}
          />
        </div>
      )}
      
      {/* Stripe Account IDs */}
      <div>
        <label>Vendor Stripe Account ID:</label>
        <input 
          type="text" 
          value={config.vendorId} 
          onChange={(e) => setConfig({...config, vendorId: e.target.value})}
          placeholder="acct_vendor123"
        />
      </div>
      
      {config.model === '3-way' && (
        <div>
          <label>Hotel Stripe Account ID:</label>
          <input 
            type="text" 
            value={config.hotelId || ''} 
            onChange={(e) => setConfig({...config, hotelId: e.target.value})}
            placeholder="acct_hotel456"
          />
        </div>
      )}
      
      {/* Destinations */}
      <div>
        <label>Delivery Fee Goes To:</label>
        <select value={config.deliveryDestination} onChange={(e) => setConfig({...config, deliveryDestination: e.target.value})}>
          <option value="platform">Platform</option>
          <option value="vendor">Vendor</option>
          {config.model === '3-way' && <option value="hotel">Hotel</option>}
        </select>
      </div>
      
      <div>
        <label>Tip Goes To:</label>
        <select value={config.tipDestination} onChange={(e) => setConfig({...config, tipDestination: e.target.value})}>
          <option value="platform">Platform</option>
          <option value="vendor">Vendor</option>
          {config.model === '3-way' && <option value="hotel">Hotel</option>}
        </select>
      </div>
      
      <button type="submit">Save Configuration</button>
    </form>
  );
};

export default ShopPaymentConfigForm;
```

---

### 5. Quick Setup Presets

For faster configuration, provide preset templates:

```javascript
const PAYMENT_PRESETS = {
  'delivery-only': {
    model: '2-way',
    platformFee: 0,
    vendorFee: 1.0,
    deliveryDestination: 'platform',
    tipDestination: 'platform'
  },
  'standard-5': {
    model: '2-way',
    platformFee: 0.05,
    vendorFee: 0.95,
    deliveryDestination: 'platform',
    tipDestination: 'platform'
  },
  'cog-based-12': {
    model: 'cog-based',
    platformFee: 0.12,
    vendorFee: 0.88,
    deliveryDestination: 'platform',
    tipDestination: 'platform'
  },
  'stadium-partnership': {
    model: '3-way',
    platformFee: 0,
    vendorFee: 0.88,
    hotelFee: 0.12,
    deliveryDestination: 'platform',
    tipDestination: 'platform'
  }
};

// Usage in dashboard:
function applyPreset(presetName, vendorId, hotelId = null) {
  const preset = PAYMENT_PRESETS[presetName];
  return {
    ...preset,
    vendorId,
    hotelId
  };
}
```

---

### 6. Migration Script for Existing Shops

```javascript
// migrate-shops.js
// Run this once to add payment-options to all existing shops

const { db } = require('./config/firebase');
const { collection, getDocs, doc, updateDoc, Timestamp } = require('firebase/firestore');

async function migrateExistingShops() {
  try {
    const shopsSnapshot = await getDocs(collection(db, 'shops'));
    
    for (const shopDoc of shopsSnapshot.docs) {
      const shopData = shopDoc.data();
      
      // Skip if already has payment-options
      if (shopData['payment-options']) {
        console.log(`Shop ${shopDoc.id} already has payment-options, skipping`);
        continue;
      }
      
      // Create default payment-options (delivery-only model)
      const paymentOptions = {
        model: '2-way',
        'platform-fee': 0,
        'vendor-fee': 1.0,
        'hotel-fee': 0,
        'delivery-destination': 'platform',
        'tip-destination': 'platform',
        'vendor-id': shopData.stripeConnectedAccountId || null,
        'hotel-id': null
      };
      
      // Update shop
      await updateDoc(doc(db, 'shops', shopDoc.id), {
        'payment-options': paymentOptions,
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ Migrated shop ${shopDoc.id}`);
    }
    
    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration error:', error);
  }
}

// Run migration
migrateExistingShops();
```

---

**Last Updated**: 2026-01-16  
**Version**: 1.0
