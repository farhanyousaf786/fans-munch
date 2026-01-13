# Inside/Outside Delivery - Database Structure

## Overview
This document explains how orders with inside/outside delivery are stored in the database.

## Order Data Structure

### 1. Inside Delivery Order Example
```json
{
  "orderId": "order_abc123",
  "customerId": "user_xyz",
  "shopId": "shop_001",
  "stadiumId": "stadium_001",
  
  // Delivery Configuration
  "deliveryMode": "delivery",
  "deliveryType": "inside",           // NEW: 'inside', 'outside', or null
  "deliveryLocation": "Gate 3",       // NEW: Selected from shop's location list
  "deliveryNotes": "Section A, Row 5, Seat 12",  // NEW: Free-form delivery instructions
  "deliveryFee": 20,
  "deliveryFeeCurrency": "USD",
  
  // Seat Information (EMPTY when using inside/outside delivery)
  "seatInfo": {
    "section": null,
    "row": null,
    "seat": null,
    "floor": null,
    "room": null,
    "stand": null,
    "entrance": null
  },
  
  // Order Items
  "items": [...],
  "subtotal": 50,
  "total": 70,
  "status": "pending"
}
```

### 2. Outside Delivery Order Example
```json
{
  "orderId": "order_def456",
  "customerId": "user_xyz",
  "shopId": "shop_001",
  "stadiumId": "stadium_001",
  
  // Delivery Configuration
  "deliveryMode": "delivery",
  "deliveryType": "outside",          // Outside venue delivery
  "deliveryLocation": "Parking Lot B", // Selected location
  "deliveryNotes": "Blue Honda, License ABC-123",
  "deliveryFee": 30,
  "deliveryFeeCurrency": "USD",
  
  // Seat Information (EMPTY)
  "seatInfo": {
    "section": null,
    "row": null,
    "seat": null,
    "floor": null,
    "room": null,
    "stand": null,
    "entrance": null
  },
  
  "items": [...],
  "subtotal": 50,
  "total": 80,
  "status": "pending"
}
```

### 3. Traditional Delivery (Room/Section) Example
```json
{
  "orderId": "order_ghi789",
  "customerId": "user_xyz",
  "shopId": "shop_001",
  "stadiumId": "stadium_001",
  
  // Delivery Configuration
  "deliveryMode": "delivery",
  "deliveryType": null,               // No inside/outside selected
  "deliveryLocation": null,
  "deliveryNotes": null,
  "deliveryFee": 15,
  "deliveryFeeCurrency": "ILS",
  
  // Seat Information (FILLED when using traditional delivery)
  "seatInfo": {
    "section": "VIP",
    "row": "5",
    "seat": "12",
    "floor": "2",
    "room": "201",
    "stand": "North",
    "entrance": "Gate A"
  },
  
  "items": [...],
  "subtotal": 50,
  "total": 65,
  "status": "pending"
}
```

## Validation Rules

### When `deliveryType` is 'inside' or 'outside':
- ✅ `deliveryLocation` is REQUIRED (selected from dropdown)
- ✅ `deliveryNotes` is OPTIONAL (free-form text)
- ❌ `seatInfo` fields (section, row, seat, floor, room) are NOT REQUIRED
- ❌ Validation for seat fields is SKIPPED

### When `deliveryType` is null (traditional delivery):
- ❌ `deliveryLocation` is NOT USED
- ❌ `deliveryNotes` is NOT USED
- ✅ `seatInfo` fields are REQUIRED (based on stadium configuration)
- ✅ Validation for seat fields is ENFORCED

## Shop Configuration

Shops must have the following structure in Firestore:

```json
{
  "shopId": "shop_001",
  "name": "Snack Bar",
  
  // Legacy delivery fee (fallback)
  "deliveryFee": 15,
  "deliveryFeeCurrency": "ILS",
  
  // Inside Delivery Configuration
  "insideDelivery": {
    "enabled": true,
    "fee": 20,
    "currency": "USD",
    "openTime": "09:00",
    "closeTime": "22:00",
    "locations": [
      { "name": "Gate 1", "description": "Main entrance" },
      { "name": "Gate 2", "description": "VIP entrance" },
      { "name": "Gate 3", "description": "North entrance" }
    ]
  },
  
  // Outside Delivery Configuration
  "outsideDelivery": {
    "enabled": true,
    "fee": 30,
    "currency": "USD",
    "openTime": "09:00",
    "closeTime": "22:00",
    "locations": [
      { "name": "Parking Lot A", "description": "Main parking" },
      { "name": "Parking Lot B", "description": "VIP parking" },
      { "name": "Street Pickup", "description": "Main street" }
    ]
  }
}
```

## Key Points

1. **Backward Compatibility**: Orders without `deliveryType` will continue to work with the legacy `deliveryFee` field.

2. **Flexible Locations**: Locations can be either simple strings or objects with `name` and `description`.

3. **Validation Logic**: The system automatically skips seat validation when inside/outside delivery is selected.

4. **Fee Selection**: 
   - Inside delivery → Uses `insideDelivery.fee`
   - Outside delivery → Uses `outsideDelivery.fee`
   - Traditional delivery → Uses legacy `deliveryFee`

5. **User Experience**:
   - User selects delivery type → Location dropdown appears
   - User selects location → Delivery notes field appears
   - Alternative button allows switching back to traditional delivery
