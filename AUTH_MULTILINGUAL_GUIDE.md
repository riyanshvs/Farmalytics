# Farmalytics Authentication and Multilingual Guide

This guide documents the current authentication and localization setup.

## Authentication Overview

- Provider: Firebase Authentication (email/password).
- Frontend token source: Firebase Web SDK.
- Backend token validation: Firebase Admin SDK.
- App user mapping: MongoDB `User` model resolved from Firebase claims.

## Frontend Auth Surface

- `src/pages/Auth.tsx`
  - Sign in
  - Sign up
  - Forgot password
- `src/context/AuthContext.tsx`
  - `register(email, password, name?)`
  - `login(email, password)`
  - `sendPasswordReset(email)`
  - session/profile synchronization
- `src/lib/firebase.ts`
  - Firebase client initialization

## Backend Auth Surface

- `backend/src/config/firebaseAdmin.js`
  - Admin SDK initialization
  - ID token verification
- `backend/src/middleware/auth.js`
  - Protects authenticated endpoints
- `backend/src/services/authUserResolver.js`
  - Resolves or creates app users from Firebase claims
- `backend/src/routes/auth.js`
  - `GET /api/auth/me`
  - `PUT /api/auth/profile`
  - `POST /api/auth/logout`

## Localization Overview

Language resources are provided through i18next locale files:

- `src/i18n/locales/en.json`
- `src/i18n/locales/hi.json`

The auth-related keys now match the email/password flow and profile email display.

## Manual Testing Steps

1. Create a new account from the sign-up mode.
2. Sign out and sign in with the same account.
3. Open profile and update name/language.
4. Confirm the selected language persists.
5. Use forgot password and verify reset email delivery.

## Troubleshooting

### `401 Firebase token is not valid`
- Check frontend Firebase project config.
- Confirm backend Firebase Admin service account values.
- Ensure the request includes `Authorization: Bearer <id-token>`.

### `Database unavailable`
- Verify `MONGODB_URI` and database connectivity.

### Profile not syncing after login
- Confirm `GET /api/auth/me` is reachable.
- Check backend logs for Firebase Admin initialization warnings.
