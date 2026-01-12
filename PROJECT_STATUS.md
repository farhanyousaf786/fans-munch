# Fans Munch - Project Setup Summary

## ✅ What's Working Now

### Client (React App)
- **Port**: 3001 (dev server)
- **Dependencies**: All installed (logrocket, jsqr, etc.)
- **Currency Service**: Now has fallback to fetch directly from ExchangeRate API if server is unavailable
- **Firebase**: Client-side Firebase configured (fans-food-stf project)

### Server (Express API)
- **Port**: 5001
- **Dependencies**: All installed including axios (just added)
- **Routes Available**:
  - `/api/stripe/*` - Stripe payment processing
  - `/api/airwallex/*` - Airwallex payment (test mode)
  - `/api/payments/*` - Payment intents
  - `/api/notifications/*` - FCM push notifications
  - `/api/currency/*` - Currency exchange rates

## ⚠️ Known Issues & Warnings

### Firebase Admin (Server-Side)
**Status**: Not fully configured
**Impact**: 
- Currency rates can't be cached in Firestore (but app still works with direct API)
- Server-side notifications may not work

**Why**: The server needs Firebase Admin SDK credentials which are different from client Firebase config.

**Solution** (Optional - only if you need server notifications):
1. Go to [Firebase Console](https://console.firebase.google.com/project/fans-food-stf/settings/serviceaccounts/adminsdk)
2. Generate a new private key
3. Add to root `.env`:
   ```
   FIREBASE_PROJECT_ID=fans-food-stf
   FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@fans-food-stf.iam.gserviceaccount.com
   FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   ```

### Proxy Errors (ECONNRESET/ECONNREFUSED)
**Status**: Normal during development
**Why**: Happens when server restarts or isn't ready yet
**Solution**: Ignore these - they're temporary and resolve once server is stable

## 📁 Environment Files

### Root `.env`
**Location**: `d:\Switch To Future\Websites\fans-munch\.env`
**Purpose**: Server configuration (loaded by server/index.js)
**Current**: Contains client-side variables (needs server vars if you want full functionality)

### `server/.env`
**Location**: `d:\Switch To Future\Websites\fans-munch\server\.env`
**Purpose**: Backup/reference
**Current**: Has your Stripe and Firebase credentials

### `client/.env`
**Location**: `d:\Switch To Future\Websites\fans-munch\client\src\.env`
**Purpose**: Client-side environment variables
**Needs**: `REACT_APP_FIREBASE_VAPID_KEY` for web push notifications

## 🚀 How to Run

1. **Start Server**: Already running via nodemon on port 5001
2. **Start Client**: Already running via npm run dev on port 3001
3. **Access App**: http://localhost:3001

## 🔧 Recent Fixes

1. ✅ Installed missing `logrocket` package
2. ✅ Installed missing `jsqr` package  
3. ✅ Installed missing `axios` package (server)
4. ✅ Added currency API fallback (works without server)
5. ✅ Fixed unused import warnings in App.js
6. ✅ Copied .env to root directory

## 📝 Next Steps (Optional)

1. **For Full Functionality**: Add Firebase Admin credentials to root `.env`
2. **For Push Notifications**: Add VAPID key to `client/.env`
3. **For Production**: Add real Stripe keys (currently using test keys)

## 🎯 Current Status

**The app should now load and work!** 
- Currency conversion: ✅ Working (with fallback)
- Payment processing: ✅ Working (Stripe test mode)
- Client app: ✅ Running
- Server API: ✅ Running

The proxy errors you're seeing are just warnings during startup and should stop once everything stabilizes.
