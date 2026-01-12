# 🏪 Shop-Based Vendor Payment Implementation

## ✅ What Was Added

### 1. **Restaurant Model** (`client/src/models/Restaurant.js`)
Added two new fields to support dynamic payment routing:

```javascript
{
  deliveryFeeCurrency: 'USD',              // Currency for delivery fee
  stripeConnectedAccountId: 'acct_...'    // Vendor's Stripe account
}
```

**Fields Added:**
- ✅ `deliveryFeeCurrency` - Currency code (USD, EUR, ILS, etc.)
- ✅ `stripeConnectedAccountId` - Stripe Connected Account ID for the shop owner

### 2. **Order Confirmation Screen** (`client/src/pages/order_confirm/OrderConfirmScreen.js`)
Updated to fetch and use vendor account from shop data:

**State Added:**
```javascript
const [vendorAccountId, setVendorAccountId] = useState(null);
```

**Fetching Logic (Lines 145-188):**
- Fetches shop data from Firebase `shops` collection
- Extracts `stripeConnectedAccountId` from shop document
- Falls back to environment variable if not set
- Logs all payment routing information

**Payment Intent Creation (Line 579):**
```javascript
vendorConnectedAccountId: vendorAccountId || process.env.REACT_APP_STRIPE_VENDOR_ACCOUNT_ID
```

---

## 📊 How It Works

### **Flow:**

1. **User adds items to cart** → Cart stores `shopId` with each item
2. **User goes to checkout** → Order confirmation page loads
3. **Fetch shop data:**
   ```javascript
   const shopRef = doc(db, 'shops', shopId);
   const shopSnap = await getDoc(shopRef);
   const shopData = shopSnap.data();
   ```
4. **Extract vendor account:**
   ```javascript
   shopVendorAccountId = shopData.stripeConnectedAccountId || null;
   ```
5. **Create payment intent** with shop's vendor account
6. **Stripe routes payment** to the correct vendor

---

## 🔧 Firebase Setup Required

### **Add to Each Shop Document:**

```javascript
// In Firebase Console: shops collection
{
  shopId: "pizza-palace-123",
  name: "Pizza Palace",
  stadiumId: "stadium-xyz",
  
  // Existing fields
  deliveryFee: 5,
  shopAvailability: true,
  
  // NEW FIELDS - Add these:
  deliveryFeeCurrency: "USD",                      // ← Add this
  stripeConnectedAccountId: "acct_1234567890ABC"   // ← Add this
}
```

### **Field Details:**

| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `deliveryFeeCurrency` | String | No | `"USD"` | Currency for delivery fee (defaults to 'USD') |
| `stripeConnectedAccountId` | String | No | `"acct_..."` | Vendor's Stripe account (defaults to env variable) |

---

## 🎯 Testing

### **Test Scenarios:**

1. **Shop WITH vendor account:**
   - Add `stripeConnectedAccountId` to shop in Firebase
   - Place order
   - Check console logs: Should show shop's account ID
   - Verify payment goes to shop's Stripe account

2. **Shop WITHOUT vendor account:**
   - Don't add `stripeConnectedAccountId` to shop
   - Place order
   - Check console logs: Should show fallback to env variable
   - Verify payment goes to default account

3. **Multiple shops:**
   - Shop A: `acct_VendorA123`
   - Shop B: `acct_VendorB456`
   - Order from each shop separately
   - Verify payments go to correct accounts

### **Console Logs to Watch:**

```
🏪 [ORDER] Getting shop data from shop ID: pizza-palace-123
🏪 [ORDER] Shop ID: pizza-palace-123
💰 deliveryFee: 5 (number)
💱 deliveryFeeCurrency: "USD" (string)
💳 stripeConnectedAccountId: "acct_1234567890ABC" (string)
💳 [PAYMENT] Using vendor account: acct_1234567890ABC
```

---

## 🚀 Deployment

### **Environment Variables (Heroku):**

Keep your existing config as fallback:
```
REACT_APP_STRIPE_VENDOR_ACCOUNT_ID=acct_fallback123
```

This will be used when:
- Shop doesn't have `stripeConnectedAccountId` field
- Shop's `stripeConnectedAccountId` is null/empty
- Error fetching shop data

---

## 📝 Summary

**Before:**
- ❌ All payments went to single vendor account from `.env`
- ❌ No way to support multiple shop owners

**After:**
- ✅ Each shop can have its own Stripe account
- ✅ Payments route to correct vendor automatically
- ✅ Fallback to `.env` for testing/backward compatibility
- ✅ Fully dynamic multi-vendor marketplace support

**Next Steps:**
1. Add `deliveryFeeCurrency` and `stripeConnectedAccountId` to shops in Firebase
2. Test with Stripe test accounts
3. Deploy to production
4. Monitor payment routing in Stripe dashboard
