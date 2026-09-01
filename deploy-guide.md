# Deploy guide

## Dashboard test / live toggle

Admin → **App Settings** (`/manage`)

| Switch | Mode |
|--------|------|
| ON | Test Stripe (`4242...` works, no real charge) |
| OFF | Live Stripe (real cards only) |

- Toggle is stored in Firestore (`appConfig/global`).
- **Heroku:** no restart needed — server re-reads Firestore every ~10s; app polls `/api/config` every ~10s.
- **Local:** restart server only when you change `server/.env` values, not when flipping the dashboard toggle.

## Keys — never commit secrets

- Real keys live in **`server/.env`** locally (gitignored).
- On **Heroku**, set **Config Vars** (not in git).
- Template: copy `server/.env.example` → `server/.env` and fill in values.

### Heroku Config Vars (you already have most of these)

**Live mode (toggle OFF):**
- `STRIPE_SECRET_KEY` or `Live` → `sk_live_...`
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` or `STRIPE_PUBLISHABLE_KEY_LIVE` → `pk_live_...`
- `STRIPE_WEBHOOK_SECRET` → live webhook secret

**Test mode (toggle ON):**
- `Test` or `STRIPE_SECRET_KEY_TEST` → `sk_test_...`
- `STRIPE_PUBLISHABLE_KEY_TEST` → `pk_test_...` ← add this if missing

Secret keys stay on the server only. The app never receives `sk_` keys in the browser.

## Deploy to Heroku

```bash
cd client
npm run build
cp -r build ../server/
cd ..
git add .
git commit -m "Your message"
git branch -D heroku-deploy
git subtree split --prefix server -b heroku-deploy
git push heroku heroku-deploy:main --force
```

## LogRocket

Enable in `client/src/App.js` before production build if needed.
