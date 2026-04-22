# Farmalytics Codebase Understanding

This document maps module ownership, runtime flows, and key risks in the current Farmalytics implementation.

## 1) Module Ownership and Boundaries

### Frontend (`src`)

- **Application shell and route gating**
  - `src/main.tsx`: bootstraps app and i18n.
  - `src/App.tsx`: providers, lazy routes, and two guard types:
    - `ProtectedRoute` for authenticated + onboarding complete users.
    - `OnboardingRoute` for public/auth/onboarding transitions.
- **Session/auth state boundary**
  - `src/context/AuthContext.tsx`: Firebase session handling, profile sync, onboarding status derivation, logout/session cleanup.
  - Boundary: this layer owns user auth state and persistence bridges to API + localStorage.
- **Language/i18n boundary**
  - `src/context/LanguageContext.tsx`, `src/i18n/index.ts`, `src/i18n/locales/*.json`.
  - Boundary: locale selection and translation resources for UI copy.
- **Feature pages**
  - `src/pages/*`: onboarding (`Location`, `FarmSize`, `CropsSelect`, `FarmDistribution`, `Completion`) and protected modules (`Dashboard`, `WeatherSoil`, `NewsReports`, `Alerts`, `Profile`, `CropsPrice`).
- **API integration boundary**
  - `src/services/api.ts`: typed API surface (`auth`, `farm`, `weather`, `alerts`, `news`, `chat`) + Firebase token attachment and fallback behavior.
  - Boundary: all frontend-to-backend communication should pass through this file.
- **Conversational UI boundary**
  - `src/components/Chatbot.tsx`: message state, history loading, send/feedback actions, local `conversationId` continuity.

### Backend (`backend/src`)

- **HTTP runtime entry and cross-cutting middleware**
  - `backend/server.js`: Express app setup, CORS/Helmet/parsers, route mounting, chat endpoints, health endpoint.
  - Boundary: central composition root for middleware and modules.
- **Authentication boundary**
  - `backend/src/middleware/auth.js`: verifies Firebase bearer tokens and populates `req.user`.
  - `backend/src/config/firebaseAdmin.js`: Firebase Admin initialization + token verification dependencies.
- **Context-aware chat boundary**
  - `backend/src/middleware/chatContext.js`: anonymous/authenticated chat context, optional farm context hydration, invalid-token handling.
  - `backend/src/services/*` (`ragService`, `conversationManager`, `responseBuilder`, `entityExtractor`, `anonymousContextStore`): chat intelligence and orchestration.
- **Domain route boundaries**
  - `backend/src/routes/auth.js`: profile read/update, logout acknowledgement.
  - `backend/src/routes/farm.js`: farm profile read/write.
  - `backend/src/routes/weather.js`: weather summary with geocoding resolution.
  - `backend/src/routes/alerts.js`: generated weather + advisory alerts and read/dismiss/reset state.
  - `backend/src/routes/news.js`: filtered news bundle and market report access.
- **Data model boundary**
  - `backend/src/models/User.js`, `Farm.js`, `ChatHistory.js`, `ChatFeedback.js`, `AlertState.js`.
  - Boundary: persistence contracts for user identity, farm profile, chat transcripts/feedback, and alert UX state.

### External System Boundaries

- **Identity**: Firebase client SDK (frontend) + Firebase Admin (backend).
- **LLM and embeddings**: Hugging Face Inference API.
- **Weather/geocoding/air quality**: Open-Meteo APIs via backend services.
- **News providers**: aggregated in `backend/src/services/newsService.js`.
- **Primary persistence**: MongoDB via Mongoose.
- **Fallback persistence**: frontend localStorage and backend in-memory stores for selected paths.

## 2) Runtime Flow Tracing

## 2.1 Auth + Session Flow

1. Frontend auth state starts in `AuthContext` via Firebase `onAuthStateChanged`.
2. If authenticated, frontend calls `api.auth.getProfile()` (`GET /api/auth/me`).
3. Backend `authMiddleware` verifies bearer token and resolves/upserts user identity context.
4. `auth/me` returns DB-backed user when Mongo is ready, or a degraded token-derived profile when DB is unavailable.
5. Frontend stores resulting user snapshot in localStorage (`userData`) and sets language/onboarding flags.

Key files:
- `src/context/AuthContext.tsx`
- `src/services/api.ts`
- `backend/src/middleware/auth.js`
- `backend/src/routes/auth.js`

## 2.2 Onboarding Data Flow

1. User goes through onboarding routes (`/location` -> `/farm-size` -> `/crops-select` -> `/farm-distribution` -> `/completion`).
2. Each step persists immediate values in localStorage for continuity.
3. Each step also attempts best-effort backend writes through `api.farm.save()` (`PUT /api/farm`).
4. Backend upserts the single `Farm` record for the user (`userId` unique model contract).
5. Completion sets `onboardingCompleted=true`, unlocking protected routes.

Key files:
- `src/App.tsx`
- `src/pages/Location.tsx`
- `src/pages/FarmSize.tsx`
- `src/pages/CropsSelect.tsx`
- `src/pages/FarmDistribution.tsx`
- `backend/src/routes/farm.js`
- `backend/src/models/Farm.js`

## 2.3 Weather/Alerts/News Data Fetch Flow

- **Weather**
  1. Frontend calls `api.weather.getSummary()` (`GET /api/weather/summary`).
  2. Backend resolves coordinates from query params or saved farm location.
  3. Service fetches weather snapshot and returns normalized location + weather payload.

- **Alerts**
  1. Frontend calls `api.alerts.getAll()` (`GET /api/alerts`).
  2. Backend derives location, generates weather alerts + static advisory alerts.
  3. Backend overlays user read/dismissed state (if DB available) and returns filtered alerts.
  4. Read/dismiss/reset actions call `POST /api/alerts/read|dismiss|reset`.

- **News**
  1. Frontend calls `api.news.getAll()` (`GET /api/news` with filters).
  2. Backend resolves location context and retrieves bundle from news service.
  3. API applies category/priority filtering + pagination and returns `news`, `marketReports`, and `meta`.

Key files:
- `src/services/api.ts`
- `backend/src/routes/weather.js`
- `backend/src/routes/alerts.js`
- `backend/src/routes/news.js`

## 2.4 Chatbot Request Lifecycle

1. Frontend `Chatbot` sends prompt via `api.chat.send(message, language, conversationId)` to `POST /api/chat`.
2. Backend `chatContextMiddleware` builds context:
   - Anonymous path: conversation-level in-memory context.
   - Auth path: hydrated user/farm context from DB.
3. Validation and rate limiting are applied with different limits for auth vs anonymous users.
4. Backend performs:
   - entity extraction,
   - RAG retrieval from local KB,
   - short conversation history fetch,
   - LLM completion through Hugging Face (or fallback generation).
5. Backend persists user+assistant turns in `ChatHistory` (when DB ready) and returns structured response.
6. Frontend updates local UI state, stores `conversationId`, renders recommendations/quick replies, and supports feedback (`POST /api/chat/feedback`).

Key files:
- `src/components/Chatbot.tsx`
- `src/services/api.ts`
- `backend/server.js`
- `backend/src/middleware/chatContext.js`
- `backend/src/models/ChatHistory.js`
- `backend/src/models/ChatFeedback.js`

## 3) Prioritized Risks and Mitigations

Priority levels: `P0` critical, `P1` high, `P2` medium.

1. **P0 - Inconsistent onboarding truth source (localStorage-first)**
   - Symptom: onboarding completion depends heavily on local keys and may diverge from backend state across devices.
   - Impact: redirect confusion and inconsistent access behavior.
   - Mitigation:
     - Define backend onboarding completeness contract (derived from `Farm` fields).
     - Return onboarding status from `GET /api/auth/me`.
     - Use backend status as primary source; localStorage as temporary cache only.

2. **P1 - Mixed API error contracts in frontend service layer**
   - Symptom: some API methods throw errors while others return `{ success: false }`.
   - Impact: page logic branches are inconsistent; failures can be silently ignored.
   - Mitigation:
     - Standardize API client behavior (either throw on non-2xx everywhere or return a uniform result wrapper).
     - Add per-domain typed result contracts and shared error mapping helper.

3. **P1 - In-memory operational state is non-durable**
   - Symptom: rate-limit buckets, anonymous context, and parts of news caching reset on process restart and are not multi-instance safe.
   - Impact: unstable behavior under scale/restarts and inconsistent user experience.
   - Mitigation:
     - Move volatile operational state to Redis (or equivalent) for distributed consistency.
     - Keep in-memory as fallback only for local development.

4. **P1 - Limited automated testing coverage**
   - Symptom: no visible test scripts in root/backend package definitions.
   - Impact: regressions likely in auth/onboarding/chat flows during change.
   - Mitigation:
     - Add smoke integration tests for critical endpoints (`auth/me`, `farm`, `chat`, `weather`, `news`).
     - Add route-guard tests for `ProtectedRoute` and onboarding transitions.

5. **P2 - Degraded DB fallback responses may hide incidents**
   - Symptom: several routes return success-like responses when DB is down.
   - Impact: client sees partial success while persistence is unavailable.
   - Mitigation:
     - Include explicit `degraded: true` metadata consistently across all fallback responses.
     - Emit structured logs/metrics for degraded path frequency and alerting.

6. **P2 - Chat history/feedback retention policy not explicit**
   - Symptom: persisted chat content lacks visible retention/deletion lifecycle in code.
   - Impact: privacy/compliance ambiguity.
   - Mitigation:
     - Define retention TTL and purge job strategy.
     - Add user-facing disclosure and deletion endpoint if required by product policy.

## 4) Quick Commands and Validation Baseline

- Frontend: `npm run dev`, `npm run build`, `npm run lint`
- Backend: `npm run dev` (inside `backend`), `npm start`, `npm run generate:kb`

## 5) Suggested Execution Sequence For Improvements

1. Normalize API contracts and onboarding source of truth.
2. Add minimum integration and guard tests for critical flows.
3. Externalize volatile runtime state (rate limit/context/cache) to shared store.
4. Introduce observability for degraded-mode responses.
5. Formalize chat data retention and privacy controls.
