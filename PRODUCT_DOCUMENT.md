# Farmalytics Product Document

## 1. Product Overview
Farmalytics is a multilingual digital farming assistant focused on helping small and medium farmers make better daily decisions.

The current product combines:
- A guided onboarding flow for farm profile setup
- A dashboard for weather, soil cues, crop and field distribution views
- A conversational AI assistant (Kissan Sahayk) with context-aware support
- Supplemental modules for market prices, alerts, and news/reports

Primary target users today:
- Farmers who prefer Hindi and Hinglish communication
- First-time digital users who need simple interfaces
- Users who need practical field-level recommendations, not generic agriculture information

## 2. Product Goals
Current product goals inferred from implementation:
- Make farm data collection easy through onboarding
- Offer everyday utility (weather, crop overview, reminders)
- Provide farm-specific AI guidance using user context and retrieval
- Keep the app resilient when dependencies are unavailable (database or LLM downtime)

## 3. Current Product Scope (As Implemented)

### 3.1 Frontend Experience
Core implemented flows:
- Landing and authentication pages
- Firebase email/password sign in and sign up
- Protected route model with onboarding gate
- Guided onboarding: greeting, location, farm size, crop selection, farm distribution, completion
- Dashboard with weather card, soil card, crop cards, and chatbot launcher
- Profile page with name update and language support

Current module maturity:
- Dashboard: functional, mixed live + static values
- Chatbot: functional, backend integrated, feedback enabled
- Weather/Soil page: mostly static display values
- Crop Price page: mostly static/mock values
- News and Reports page: mock data with rich UI filtering
- Alerts page: mock data with local state management

### 3.2 Backend/API Capabilities
Implemented API domains:
- Auth APIs (`/api/auth/me`, `/api/auth/profile`, `/api/auth/logout`)
- Farm APIs (`/api/farm` GET/PUT)
- Chat APIs (`/api/chat`, `/api/chat/history`, `/api/chat/feedback`)
- Health endpoint (`/health`)

Chat backend capabilities:
- Context middleware for farm-aware prompts
- Basic entity extraction and retrieval-augmented prompt composition
- Chat history persistence by conversation (when DB available)
- User feedback capture on assistant responses
- Rate limiting and payload validation middleware
- Graceful fallback responses when LLM or DB is unavailable

### 3.3 Data and Identity
- Identity: Firebase client auth + backend token verification
- App profile and farm records: MongoDB models
- Chat history and feedback: MongoDB-backed when available
- Localization: i18next with at least English and Hindi support

## 4. User Journey (Current)
1. User opens app and chooses sign in or sign up.
2. User authenticates through Firebase.
3. If onboarding not complete, user is redirected through farm setup steps.
4. User reaches dashboard and can:
- View summary cards
- Access feature modules from navigation
- Open chatbot and ask farm questions
5. User can update profile name and language, and continue sessions with persistent auth state.

## 5. Product Strengths
- Strong onboarding-first UX for agriculture context capture
- Multilingual direction is embedded early in architecture
- Chat module has meaningful resilience (fallback strategy across frontend and backend)
- Clear modular separation of auth, farm, and chat APIs
- Route protection and auth-loading handling reduce broken entry states

## 6. Current Gaps and Risks
- Multiple user-facing modules still run on mock/static data (alerts, news/reports, crop price, weather/soil details).
- Limited evidence of automated test coverage across frontend and backend.
- Data quality and freshness pipeline for prices, weather, and advisories is not fully integrated end to end.
- Analytics and product telemetry are not visible in current implementation, limiting outcome measurement.
- Security hardening is partially implemented but still requires periodic audit and verification in production settings.
- Offline-first experience is limited (partial fallback behavior exists, but no complete sync model for low-connectivity users).

## 7. Improvement Opportunities (Prioritized)

### Priority 0: Product Reliability and Trust (Immediate)
1. Replace static business modules with real data integrations.
- Connect Weather/Soil to trusted weather and soil advisory sources.
- Connect Crop Price to mandi/market APIs with locality-aware filtering.
- Connect Alerts and News to curated backend feeds.

2. Add baseline automated quality gates.
- Frontend: route, auth, and onboarding integration tests.
- Backend: auth, farm, and chat API tests.
- Add CI checks for build, lint, and test before merge.

3. Improve observability for production operations.
- API latency/error dashboards.
- Chat fallback rate monitoring.
- Alerting for external provider failures.

### Priority 1: Personalization and Decision Support (Near-Term)
1. Make recommendations farm-stage aware.
- Include crop growth stage, season, and district in advisories.
- Add actionable daily checklist cards on dashboard.

2. Expand profile and farm data depth.
- Add irrigation source, soil type, preferred crops, and language/dialect preferences.
- Build profile completeness score to improve recommendation quality.

3. Improve chatbot confidence and transparency.
- Show source hints for recommendations where possible.
- Add explicit confidence levels or caution labels for uncertain guidance.

### Priority 2: Growth, Adoption, and Scale (Strategic)
1. Build low-connectivity mode.
- Cache critical content and recent advisories.
- Queue writes and sync when network resumes.

2. Add farmer community and extension workflows.
- Community Q&A and expert escalation flow.
- Integration path for agriculture officers or field agents.

3. Launch measurable engagement loops.
- Weekly farm health summary.
- Smart notifications based on weather and crop events.
- In-app nudges tied to user lifecycle milestones.

## 8. Suggested 90-Day Roadmap

### Phase 1 (Weeks 1-4): Foundation Hardening
- Implement real weather and market data connectors
- Add API contract tests and core UI integration tests
- Add runtime monitoring and error alerting

### Phase 2 (Weeks 5-8): Personalization
- Introduce farm-stage and district-aware recommendations
- Expand farmer profile model and onboarding fields
- Improve chatbot explainability and confidence signaling

### Phase 3 (Weeks 9-12): Engagement and Scale
- Build notification relevance engine
- Add partial offline support and sync
- Launch success dashboard for product KPIs

## 9. Success Metrics
Suggested measurable outcomes:
- Activation: onboarding completion rate
- Retention: weekly active users and 4-week retention
- Utility: average sessions per user per week
- Advisory quality: positive chatbot feedback rate
- Reliability: chat success rate without fallback
- Trust: repeat usage of alerts/weather/crop modules

## 10. Recommended Immediate Next Actions
1. Implement backend data providers for weather and crop price modules.
2. Replace mock alerts/news feeds with API-backed sources.
3. Add a minimum CI pipeline (lint, unit tests, API tests).
4. Add product telemetry events for onboarding, dashboard usage, and chatbot outcomes.
