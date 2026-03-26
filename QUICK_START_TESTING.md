# Quick Start Testing Guide

This quick-start focuses on the active Firebase email/password authentication flow and multilingual behavior.

## Prerequisites

1. Frontend environment variables are set.
2. Backend environment variables are set.
3. MongoDB is running and reachable.

## Run the App

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
npm install
npm run dev
```

## Auth Test Plan

1. Open the app and switch to sign-up mode.
2. Register with email, strong password, and optional name.
3. Confirm successful redirect after registration.
4. Sign out.
5. Sign in with the same credentials.
6. Open profile and update name/language.
7. Use forgot password and confirm reset email is sent.

## API Sanity Checks

While signed in:

1. `GET /api/auth/me` returns user data.
2. `PUT /api/auth/profile` updates name/language.
3. Authenticated farm and chat endpoints work.

While signed out:

1. Protected endpoints return `401`.

## Build Verification

### Frontend build
```bash
npm run build
```

### Backend syntax check
```bash
cd backend
node --check server.js
```

## Common Failure Points

- Missing `VITE_FIREBASE_*` values in frontend env.
- Missing `FIREBASE_*` values in backend env.
- Expired or invalid Firebase token in request headers.
- MongoDB not connected when profile/farm endpoints are called.
