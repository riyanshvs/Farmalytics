# Farmalytics Developer Quick Reference

This quick reference reflects the current authentication model: Firebase email/password on the frontend with Firebase Admin token verification on the backend.

## Current Auth Flow

1. User signs in or signs up in `src/pages/Auth.tsx`.
2. Firebase Authentication issues an ID token.
3. Frontend attaches `Authorization: Bearer <token>` in `src/services/api.ts`.
4. Backend verifies the token in `backend/src/middleware/auth.js` via `backend/src/config/firebaseAdmin.js`.
5. Backend resolves the application user record using `backend/src/services/authUserResolver.js`.

## Key Files

### Frontend
- `src/lib/firebase.ts`: Firebase SDK initialization.
- `src/context/AuthContext.tsx`: register, login, reset password, session sync.
- `src/services/api.ts`: authenticated API calls using Firebase ID tokens.
- `src/pages/Auth.tsx`: sign in, sign up, forgot password UI.
- `src/pages/Profile.tsx`: profile display and update.

### Backend
- `backend/src/config/firebaseAdmin.js`: Admin SDK setup and token verification.
- `backend/src/middleware/auth.js`: route protection using verified tokens.
- `backend/src/services/authUserResolver.js`: map Firebase claims to `User` documents.
- `backend/src/routes/auth.js`: `/me`, `/profile`, `/logout` endpoints.
- `backend/src/models/User.js`: user schema with `firebaseUid`, `email`, `emailVerified`.

## Environment Variables

### Frontend (`.env`)
- `VITE_API_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

### Backend (`backend/.env`)
- `MONGODB_URI`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `HUGGING_FACE_API_KEY`
- `PORT`

## Local Verification Checklist

1. Start backend and frontend.
2. Sign up with email/password.
3. Sign in with the same account.
4. Confirm `/api/auth/me` returns the logged-in user.
5. Confirm profile updates are persisted.
6. Trigger forgot password and confirm reset email is sent.
7. Confirm protected routes reject unauthenticated requests.

## Build Commands

### Frontend
```bash
npm run build
```

### Backend syntax
```bash
cd backend
node --check server.js
```

## Notes

- Legacy phone-based authentication code has been removed from runtime source.
- If auth calls fail with `401`, verify Firebase env variables first, then ensure a valid ID token is being sent by the client.
