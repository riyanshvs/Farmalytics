# Farmalytics Reliability Implementation Checklist

This checklist turns the architecture findings into an executable plan mapped to current files.

## Phase 1 - Backend Source of Truth for Onboarding

### Goal
Make onboarding status backend-driven and consistent across devices/sessions.

### Tasks
- [ ] Add onboarding completeness helper in backend.
  - Files:
    - `backend/src/routes/auth.js`
    - `backend/src/models/Farm.js`
  - Action:
    - Compute `onboardingCompleted` from required fields:
      - `location.state`, `location.district`
      - `farmSize > 0`
      - `selectedCrops.length > 0`
      - valid `distributions` with positive `area`
- [ ] Return `onboardingCompleted` in `GET /api/auth/me`.
  - File: `backend/src/routes/auth.js`
- [ ] Include onboarding status in degraded mode response too.
  - File: `backend/src/routes/auth.js`
- [ ] Update frontend auth bootstrap to trust backend onboarding first.
  - File: `src/context/AuthContext.tsx`
  - Action:
    - Read `result.user.onboardingCompleted` from profile response.
    - Keep local derivation as fallback only.
- [ ] Keep onboarding step writes best-effort but backend-first.
  - Files:
    - `src/pages/Location.tsx`
    - `src/pages/FarmSize.tsx`
    - `src/pages/CropsSelect.tsx`
    - `src/pages/FarmDistribution.tsx`

### Acceptance Criteria
- [ ] Logging in on a second device reflects correct onboarding route.
- [ ] Clearing browser storage does not break onboarding state recovery.
- [ ] `GET /api/auth/me` always includes explicit onboarding status.

---

## Phase 2 - Standardize API Contracts + React Query Migration

### Goal
Use one consistent data-fetching pattern with predictable loading/error/caching.

### Tasks
- [ ] Standardize API service behavior.
  - File: `src/services/api.ts`
  - Action:
    - Choose one pattern:
      - A) throw on non-2xx, or
      - B) always return `{ success, data, error }`
    - Apply uniformly across `auth`, `farm`, `weather`, `alerts`, `news`, `chat`.
- [ ] Define shared query keys.
  - Files:
    - `src/lib/` (new file, e.g. `queryKeys.ts`)
  - Keys:
    - `farm`, `weatherSummary`, `alerts`, `news`, `chatHistory`, `profile`
- [ ] Migrate weather data fetching to `useQuery`.
  - File: `src/pages/WeatherSoil.tsx`
- [ ] Migrate alerts loading and state updates to query/mutation.
  - File: `src/pages/Alerts.tsx`
- [ ] Migrate news feed to query with filter-aware key.
  - File: `src/pages/NewsReports.tsx`
- [ ] Migrate profile fetch/update to query/mutation.
  - File: `src/pages/Profile.tsx`
- [ ] Migrate chat history loading to query.
  - File: `src/components/Chatbot.tsx`
- [ ] Tune global QueryClient defaults.
  - File: `src/App.tsx`
  - Action:
    - set `retry`, `staleTime`, and `refetchOnWindowFocus` intentionally.

### Acceptance Criteria
- [ ] No page-level manual `loading/error/data` fetch boilerplate for migrated modules.
- [ ] Data refresh happens via invalidation after successful mutations.
- [ ] Query keys are centralized and reused.

---

## Phase 3 - Make Degraded Mode Explicit and Observable

### Goal
Keep fallback behavior, but ensure it is visible to clients and operators.

### Tasks
- [ ] Add consistent degraded metadata across fallback responses.
  - Files:
    - `backend/src/routes/auth.js`
    - `backend/src/routes/farm.js`
    - `backend/server.js` (chat fallbacks)
    - `backend/src/routes/alerts.js`
    - `backend/src/routes/news.js` (if applicable)
  - Shape:
    - `degraded: true`
    - `degradedReason: "db_unavailable" | "provider_unavailable" | ...`
- [ ] Add structured warning logs when degraded path is used.
  - Files: same route files as above
- [ ] Extend health endpoint with DB readiness detail.
  - File: `backend/server.js`
  - Example field: `dependencies.mongo.readyState`
- [ ] Frontend: surface degraded responses non-intrusively.
  - Files:
    - `src/pages/WeatherSoil.tsx`
    - `src/pages/Alerts.tsx`
    - `src/pages/NewsReports.tsx`
    - `src/components/Chatbot.tsx`

### Acceptance Criteria
- [ ] Fallback responses are machine-detectable by UI and monitoring.
- [ ] Operators can identify DB/provider outage from logs and health endpoint.

---

## Phase 4 - Replace In-Memory Cache/Rate Limits with Redis

### Goal
Make cache and throttling stable across restarts and multiple instances.

### Tasks
- [ ] Introduce Redis client utility.
  - Files:
    - `backend/src/config/` (new file, e.g. `redis.js`)
    - `backend/package.json` (add dependency)
- [ ] Add provider toggles in env.
  - Files:
    - `backend/.env.example`
    - `backend/.env` (local only)
  - Variables:
    - `REDIS_URL`
    - `CACHE_PROVIDER=memory|redis`
    - `RATE_LIMIT_PROVIDER=memory|redis`
- [ ] Refactor rate limiter to pluggable store.
  - File: `backend/src/middleware/rateLimit.js`
  - Action:
    - Use Redis atomic increments + expiry for request windows.
- [ ] Refactor news cache to Redis TTL cache.
  - File: `backend/src/services/newsService.js`
- [ ] Keep memory mode for local fallback/dev.
  - Files:
    - `backend/src/middleware/rateLimit.js`
    - `backend/src/services/newsService.js`

### Acceptance Criteria
- [ ] Rate limits remain consistent after server restart.
- [ ] News cache survives process restarts and works across instances.
- [ ] Local dev can still run without Redis (memory provider).

---

## Phase 5 - Add Automated Test Baseline

### Goal
Protect critical user journeys and API behavior from regressions.

### Tasks
- [ ] Add backend test framework and scripts.
  - File: `backend/package.json`
  - Suggested:
    - `vitest` + `supertest`
    - script: `test`
- [ ] Add backend integration tests for critical endpoints.
  - New folder: `backend/tests/`
  - Tests:
    - `GET /api/auth/me`
    - `PUT/GET /api/farm`
    - `GET /api/weather/summary`
    - `GET /api/news`
    - `POST /api/chat`
- [ ] Add frontend test framework and scripts.
  - File: `package.json`
  - Suggested:
    - `vitest`, `@testing-library/react`, `@testing-library/jest-dom`
- [ ] Add frontend route/auth tests.
  - New folder: `src/tests/`
  - Tests:
    - `ProtectedRoute` behavior
    - onboarding redirects in `OnboardingRoute`
    - `AuthContext` bootstrap fallback behavior

### Acceptance Criteria
- [ ] `npm test` passes in root and backend.
- [ ] CI can run lint + tests on pull requests.
- [ ] Core flows are covered by smoke tests.

---

## Recommended Execution Order

1. Phase 1 (onboarding truth source)
2. Phase 2 (API contract + React Query)
3. Phase 3 (degraded-mode visibility)
4. Phase 4 (Redis durability)
5. Phase 5 (tests + CI gates)

## PR Slicing Strategy

- PR 1: onboarding truth source + `/auth/me` shape update.
- PR 2: API contract standardization + first React Query migration (`WeatherSoil`, `Alerts`).
- PR 3: remaining React Query migration (`NewsReports`, `Profile`, `Chatbot` history).
- PR 4: degraded metadata + health endpoint observability.
- PR 5: Redis cache/rate limiter provider abstraction.
- PR 6: backend and frontend test baseline.
