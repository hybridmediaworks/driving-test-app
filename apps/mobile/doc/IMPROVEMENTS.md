# DMV Genie — Improvement Tasks

> Track progress on all identified improvements. Review each task before proceeding to the next.

---

## Status Legend
- `[ ]` To Do
- `[~]` In Progress
- `[x]` Done
- `[skip]` Skipped / Not Applicable

---

## Task List

### TASK-01 — State Management (Zustand + AsyncStorage)
**Status:** `[x]`
**Priority:** Critical
**Description:**
Add Zustand store with AsyncStorage persistence to hold user data across app restarts. User onboarding selections (vehicle type, state, exam date) currently disappear on navigation.

**Scope:**
- Install `zustand` and `@react-native-async-storage/async-storage`
- Create `store/userStore.ts` (vehicle, state, exam date, preferences)
- Create `store/progressStore.ts` (test scores, completed topics)
- Wire onboarding screens to write to the store
- Wire settings screen to read/update from the store

---

### TASK-02 — Service Layer (Remove Hardcoded Data)
**Status:** `[x]`
**Priority:** Critical
**Description:**
All test questions, theory items, and progress data are hardcoded arrays inside components. Extract them into a dedicated service layer.

**Scope:**
- Create `services/testService.ts` (fetch/mock test questions)
- Create `services/userService.ts` (user profile CRUD)
- Create `services/progressService.ts` (track scores, streaks)
- Move all hardcoded mock arrays out of components into `data/` folder
- Update components to consume from services

---

### TASK-03 — Wire Up Event Handlers
**Status:** `[ ]`
**Priority:** Critical
**Description:**
All button/interaction callbacks are `console.log()` placeholders. Nothing is actually connected to navigation or business logic.

**Scope:**
- Replace all `console.log` handlers in `index.tsx`, onboarding screens, and settings
- Connect navigation using Expo Router's `router.push()`
- Wire "Start Test", "Continue", "Bookmark" and all CTA buttons
- Connect settings toggles to the Zustand store

---

### TASK-04 — Type-Safe Navigation (Expo Router Typed Routes)
**Status:** `[ ]`
**Priority:** Medium
**Description:**
`typedRoutes: true` is already set in `app.json` but not being used. All routes are currently plain strings.

**Scope:**
- Enable Expo Router typed routes throughout the app
- Replace all hardcoded string routes with typed route references
- Fix any route mismatches found during migration

---

### TASK-05 — Refactor Monolithic Components
**Status:** `[ ]`
**Priority:** Medium
**Description:**
`index.tsx` (210+ lines) and `today-header.tsx` (161+ lines) are too large. Logic and UI are mixed together.

**Scope:**
- Split `index.tsx` into: `<HeroSection />`, `<TestSection />`, `<TheorySection />`
- Extract animated logic from `today-header.tsx` into a custom hook
- Ensure each component is under ~100 lines with a single responsibility

---

### TASK-06 — TypeScript Cleanup
**Status:** `[ ]`
**Priority:** Medium
**Description:**
`constants/colors.js` is plain JavaScript and breaks type safety. Stale template code exists in the Progress screen.

**Scope:**
- Convert `constants/colors.js` → `colors.ts` with proper types
- Remove leftover Expo template references from Progress screen
- Audit and fix any `any` types across the codebase

---

### TASK-07 — Input Validation & Error States
**Status:** `[ ]`
**Priority:** Medium
**Description:**
No form validation exists in onboarding. No error boundaries. No loading or empty states in the UI.

**Scope:**
- Add validation logic to all onboarding input/selection steps
- Add error messages to the `Input` component
- Add loading skeletons or spinners where data is fetched
- Add an `ErrorBoundary` wrapper at the root layout level

---

### TASK-08 — Test Coverage
**Status:** `[ ]`
**Priority:** Low (but important before release)
**Description:**
Zero test files exist in the project.

**Scope:**
- Set up Jest + React Native Testing Library
- Write unit tests for Zustand stores
- Write unit tests for service layer functions
- Write component tests for critical UI (onboarding flow, test screen)

---

### TASK-09 — Analytics & Crash Reporting
**Status:** `[ ]`
**Priority:** Low
**Description:**
No error tracking or usage analytics in place.

**Scope:**
- Integrate Sentry (or similar) for crash reporting
- Add basic analytics events (test started, test completed, onboarding completed)

---

## Progress Summary

| Task | Title | Priority | Status |
|------|-------|----------|--------|
| TASK-01 | State Management (Zustand + AsyncStorage) | Critical | `[x]` |
| TASK-02 | Service Layer (Remove Hardcoded Data) | Critical | `[x]` |
| TASK-03 | Wire Up Event Handlers | Critical | `[ ]` |
| TASK-04 | Type-Safe Navigation | Medium | `[ ]` |
| TASK-05 | Refactor Monolithic Components | Medium | `[ ]` |
| TASK-06 | TypeScript Cleanup | Medium | `[ ]` |
| TASK-07 | Input Validation & Error States | Medium | `[ ]` |
| TASK-08 | Test Coverage | Low | `[ ]` |
| TASK-09 | Analytics & Crash Reporting | Low | `[ ]` |
