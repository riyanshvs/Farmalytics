# Farmalytics Technical Architecture

This document summarizes the active application architecture after migration to Firebase email/password authentication.

## High-Level Components

### Frontend
- React + TypeScript + Vite
- i18next localization (`en`, `hi`)
- Firebase Web SDK for client-side authentication
- API service layer that injects Firebase ID tokens

### Backend
- Express API server
- MongoDB with Mongoose
- Firebase Admin SDK for token verification
- Domain modules for auth, farm data, and chat flows

## Authentication Architecture

### Identity and Session
1. User authenticates with Firebase email/password.
2. Firebase returns an ID token to the client.
3. Client sends token in bearer auth header.
4. Backend verifies token with Firebase Admin.
5. Backend resolves an app-level user record in MongoDB.

### Core Auth Modules
- `src/lib/firebase.ts` (frontend)
- `src/context/AuthContext.tsx` (frontend)
- `src/services/api.ts` (frontend)
- `backend/src/config/firebaseAdmin.js`
- `backend/src/middleware/auth.js`
- `backend/src/services/authUserResolver.js`
- `backend/src/routes/auth.js`
- `backend/src/models/User.js`

## Data Model Snapshot

`User` model core fields:
- `firebaseUid`
- `email`
- `emailVerified`
- `authProvider`
- `name`
- `language`
- timestamps

## API Contracts (Auth)

- `GET /api/auth/me`
  - Returns authenticated user profile.

- `PUT /api/auth/profile`
  - Updates profile fields (`name`, `language`).

- `POST /api/auth/logout`
  - Client-side sign out coordination endpoint.

## Localization Architecture

- Translation resources are stored in JSON locale files.
- Language selection is applied through i18next context.
- Profile language updates are persisted and reapplied on session sync.

## Operational Checks

1. Build frontend successfully.
2. Validate backend syntax.
3. Verify Firebase env completeness.
4. Verify MongoDB connectivity.
5. Exercise auth + profile + farm + chat flows.
