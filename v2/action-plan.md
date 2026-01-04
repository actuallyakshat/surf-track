# Surf Track v2 - Implementation Action Plan

## Executive Summary

Building v2 of Surf Track chrome extension with improved accuracy and robustness. Using **hybrid approach**: implement core tracking improvements (persistent state, idle detection) + essential UI (dashboard, blocking) + data archiving, all with incremental testing.

### Key Improvements Over v1
1. **Persistent state** via chrome.storage.session (survives service worker restarts)
2. **No 30-second cap** on tracking (accurate long sessions)
3. **Idle detection** with 60s threshold (prevents tracking when user away)
4. **Event-driven UI updates** (no polling overhead)
5. **Data archiving** (90-day retention policy)
6. **Website blocking** (feature parity with v1)

### Tech Stack
- **Framework**: Plasmo 0.90.5 (already scaffolded)
- **UI**: React 18.2 + TypeScript 5.3 + Tailwind CSS 3.4
- **Charts**: Recharts 2.15
- **Testing**: Vitest for unit/integration tests (non-UI)
- **Storage**: chrome.storage.session + chrome.storage.local

---

## Implementation Phases

### Phase 1: Foundation & Types (Day 1)
**Goal**: Setup project structure, type definitions, and utility functions

#### Tasks
1. Create type definitions (`/types/index.ts`)
   - ScreenTimeData, TrackingState, StorageSchema types
   - DomainTimeData, ArchivedScreenTimeData types

2. Create constants (`/lib/constants.ts`)
   - ALARM_NAMES, IDLE_THRESHOLD_SECONDS (60)
   - DATA_RETENTION_DAYS (90), IGNORED_DOMAINS array

3. Create time utilities (`/lib/time-utils.ts`)
   - formatSeconds(), getYearWeek(), getTodayDate()
   - formatDateShort(), formatDateHeader(), getWeekDates()

4. Create domain utilities (`/lib/domain-utils.ts`)
   - getDomainFromUrl(), isIgnoredDomain()

5. Create data transformations (`/lib/data-transformations.ts`)
   - extractDailyDomains(), aggregateWeekData()
   - extractAllDomains()

6. Create Tailwind helper (`/lib/utils.ts`)
   - cn() function for conditional classes

#### Testing
- Write unit tests for all utility functions (Vitest)
- Test edge cases: empty data, invalid URLs, date boundaries

#### Files Created
```
v2/types/index.ts
v2/lib/constants.ts
v2/lib/time-utils.ts
v2/lib/domain-utils.ts
v2/lib/data-transformations.ts
v2/lib/utils.ts
```

---

### Phase 2: Background Services - Storage & Idle (Days 2-3)
**Goal**: Implement storage abstraction and idle detection

#### Tasks
1. Create StorageManager (`/background/storage-manager.ts`)
   - Session state operations (get/set/update TrackingState)
   - Screen time data operations (getScreenTimeData, addTimeToCurrentDay)
   - Blocked domains operations (get/add/remove/isBlocked)
   - Favicon updates

2. Create IdleDetector (`/background/idle-detector.ts`)
   - start(): Setup chrome.idle with 60s threshold
   - handleStateChange(): Process idle state transitions
   - queryCurrentState(): Promise wrapper for chrome.idle.queryState

3. Create DataArchiver (`/background/data-archiver.ts`)
   - scheduleArchiving(): Setup daily alarm
   - archiveOldData(): Move 90+ day old data to archive
   - getArchivedData(): Retrieve archived data

#### Testing
- Unit tests for StorageManager methods with mocked chrome.storage
- Integration tests for data archiving logic
- Test edge cases: storage errors, concurrent writes, empty data

#### Files Created
```
v2/background/storage-manager.ts
v2/background/idle-detector.ts
v2/background/data-archiver.ts
```

---

### Phase 3: Background Services - Tracking Engine (Days 4-5)
**Goal**: Implement core time tracking logic

#### Tasks
1. Create TrackingEngine (`/background/tracking-engine.ts`)
   - initialize(): Reset tracking state, setup alarms
   - resume(): Restore tracking after service worker restart
   - handleTabActivated(): Track new active tab
   - handleUrlChange(): Track navigation within tab
   - handleWindowFocusChange(): Handle window switching
   - handleIdleState(): Pause/resume tracking on idle
   - saveCurrentSession(): Calculate and save elapsed time
   - startTracking(): Begin tracking new URL/domain

2. Create main service worker (`/background/index.ts`)
   - Initialize all services (TrackingEngine, IdleDetector, DataArchiver)
   - Setup event listeners: tabs, windows, idle, alarms
   - Handle runtime.onInstalled and runtime.onStartup

#### Testing
- Integration tests for TrackingEngine with mocked Chrome APIs
- Test scenarios:
  - Tab switching preserves time
  - Service worker restart resumes correctly
  - Idle state stops/starts tracking
  - Multi-window focus changes
  - No 30s cap on long sessions

#### Files Created
```
v2/background/tracking-engine.ts
v2/background/index.ts
```

#### Manual Testing Checklist
- [ ] Load extension in chrome://extensions
- [ ] Switch between tabs rapidly
- [ ] Wait 60s to trigger idle (verify tracking stops)
- [ ] Resume activity (verify tracking resumes)
- [ ] Force service worker restart (chrome://extensions → Details → Inspect → Close)
- [ ] Verify state persists across restart
- [ ] Check chrome.storage.session and chrome.storage.local in DevTools

---

### Phase 4: UI Foundation (Days 6-7)
**Goal**: Setup React structure, routing, and global state

#### Tasks
1. Setup Tailwind config (`/tailwind.config.js`)
   - Configure content paths, darkMode, plasmo- prefix
   - Add CSS variables for theming

2. Create global styles (`/styles/globals.css`)
   - Tailwind directives
   - CSS variables for colors
   - Font imports (Inter)

3. Copy shadcn/ui components to `/components/ui/`
   - button.tsx, card.tsx, input.tsx, label.tsx
   - switch.tsx, tooltip.tsx, alert.tsx
   - Adapt for plasmo- prefix in all className usages

4. Create error boundary (`/components/error-boundary.tsx`)
   - Class component with getDerivedStateFromError
   - Fallback UI with error message and retry button

5. Create loading state (`/components/loading-state.tsx`)
   - Simple spinner with optional message

6. Create global context (`/context/global-context.tsx`)
   - GlobalProvider with chrome.storage.onChanged listener
   - Manage screenTimeData, blockedDomains, isLoading, error
   - NO POLLING - event-driven updates only

7. Create context hook (`/hooks/use-global-context.ts`)
   - Type-safe useContext wrapper with error handling

8. Update popup entry (`/popup.tsx`)
   - Setup MemoryRouter with routes: "/" and "/blocked"
   - Wrap with GlobalProvider and ErrorBoundary
   - Fixed 500×600px dimensions

#### Testing
- Manual: Extension loads, popup opens, no console errors
- Test chrome.storage.onChanged triggers context updates

#### Files Created/Modified
```
v2/tailwind.config.js (MODIFY)
v2/styles/globals.css
v2/components/ui/button.tsx
v2/components/ui/card.tsx
v2/components/ui/input.tsx
v2/components/ui/label.tsx
v2/components/ui/switch.tsx
v2/components/ui/tooltip.tsx
v2/components/ui/alert.tsx
v2/components/error-boundary.tsx
v2/components/loading-state.tsx
v2/context/global-context.tsx
v2/hooks/use-global-context.ts
v2/popup.tsx (MODIFY)
```

---

### Phase 5: Dashboard UI (Days 8-9)
**Goal**: Build main time tracking views

#### Tasks
1. Create TopBar (`/components/top-bar.tsx`)
   - Navigation buttons: Dashboard, Blocked
   - Active route styling with useLocation

2. Create Dashboard (`/components/dashboard.tsx`)
   - Layout: TopBar + ScreenTime (flex column)

3. Create ScreenTime (`/components/screen-time.tsx`)
   - Manage selectedDate state
   - Week navigation: previous/next/today buttons
   - Coordinate chart and breakdown components
   - Loading and error states

4. Create ScreenTimeChart (`/components/screen-time-chart.tsx`)
   - Recharts BarChart for weekly view
   - Memoized data transformation (useMemo)
   - Custom tooltip with formatSeconds
   - Bar click handler to select date

5. Create DailyBreakdown (`/components/daily-breakdown.tsx`)
   - Domain list sorted by time (descending)
   - Favicon display with error fallback
   - Memoized domain extraction
   - Empty state message

#### Testing
- Manual: Navigate between dates, click chart bars
- Verify data updates when background tracking runs
- Test with empty data (no crashes)
- Test with large dataset (100+ domains)

#### Files Created
```
v2/components/top-bar.tsx
v2/components/dashboard.tsx
v2/components/screen-time.tsx
v2/components/screen-time-chart.tsx
v2/components/daily-breakdown.tsx
```

---

### Phase 6: Blocking Feature (Day 10)
**Goal**: Implement website blocking

#### Tasks
1. Create Blocked component (`/components/blocked.tsx`)
   - TopBar navigation
   - Add domain input with Enter key support
   - Domain list with remove buttons
   - Direct StorageManager integration
   - Empty state handling

2. Add blocking enforcement in background worker
   - Listen for chrome.tabs.onUpdated
   - Check if domain is blocked (StorageManager.isBlocked)
   - Redirect to blocked page or close tab

#### Testing
- Manual: Add domain to blocked list
- Navigate to blocked domain
- Verify blocking behavior
- Remove domain, verify unblocked

#### Files Created
```
v2/components/blocked.tsx
```

#### Modified
```
v2/background/index.ts (add blocking logic)
```

---

### Phase 7: Integration & Polish (Days 11-12)
**Goal**: Final integration, optimization, edge case handling

#### Tasks
1. Add memoization throughout UI
   - useMemo for data transformations
   - useCallback for event handlers
   - Verify no unnecessary re-renders

2. Performance testing
   - Test with large datasets (100+ domains, 90 days)
   - Verify chrome.storage operations are efficient
   - Check memory usage in service worker

3. Edge case testing
   - Service worker suspension during active tracking
   - Storage corruption handling
   - Network errors (favicon loading)
   - Rapid tab switching (stress test)
   - Multiple windows open simultaneously

4. Error handling verification
   - All loading states work correctly
   - All error states display user-friendly messages
   - Error boundary catches React errors

5. TypeScript strict mode
   - Enable strict mode in tsconfig.json
   - Fix any type errors
   - No 'any' types

#### Testing
- Comprehensive manual testing of all features
- Load test with 500+ tab switches
- Verify idle detection triggers at 60s
- Test service worker restart scenarios

---

### Phase 8: Documentation & Packaging (Day 13)
**Goal**: Production build and documentation

#### Tasks
1. Update package.json
   - Verify all dependencies are correct
   - Update version to 2.0.0
   - Add proper scripts

2. Create v2 README (`/v2/README.md`)
   - Architecture overview
   - Development setup instructions
   - Testing guide
   - Build and deployment instructions

3. Production build
   - Run `pnpm build` (Plasmo production build)
   - Test production bundle in Chrome
   - Verify manifest.json is correct

4. Create migration guide
   - Document v1 → v2 data compatibility
   - User-facing changelog
   - Breaking changes (if any)

5. Final testing
   - Clean install in fresh Chrome profile
   - Verify all features work
   - Check extension size and performance

#### Files Created
```
v2/README.md
```

---

## Critical Files Reference

### Background Service Worker
- `/background/index.ts` - Main service worker entry
- `/background/tracking-engine.ts` - Core tracking logic
- `/background/storage-manager.ts` - All storage operations
- `/background/idle-detector.ts` - Idle state management
- `/background/data-archiver.ts` - Data retention

### UI Components
- `/popup.tsx` - Entry point with routing
- `/components/dashboard.tsx` - Main view
- `/components/screen-time.tsx` - Time tracking coordinator
- `/components/screen-time-chart.tsx` - Weekly bar chart
- `/components/daily-breakdown.tsx` - Domain list
- `/components/blocked.tsx` - Blocking management

### State & Context
- `/context/global-context.tsx` - Global state provider
- `/hooks/use-global-context.ts` - Context consumer

### Utilities
- `/lib/time-utils.ts` - Time/date formatting
- `/lib/domain-utils.ts` - URL/domain extraction
- `/lib/data-transformations.ts` - Data processing
- `/lib/constants.ts` - All constants

### Types
- `/types/index.ts` - All TypeScript types

---

## Architecture Highlights

### Persistent State Management
```typescript
// chrome.storage.session for tracking state (survives SW restarts)
type TrackingState = {
  currentUrl: string | null;
  currentDomain: string | null;
  startTime: number | null;  // timestamp
  focusedWindowId: number | null;
  isIdle: boolean;
  lastSaveTime: number;
};
```

### Event-Driven UI Updates (No Polling!)
```typescript
// In GlobalProvider
chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== "local") return;
  if (changes.screenTimeData) {
    setScreenTimeData(changes.screenTimeData.newValue);
  }
});
```

### Idle Detection
```typescript
// 60-second threshold
chrome.idle.setDetectionInterval(60);
chrome.idle.onStateChanged.addListener((state) => {
  // state: "active" | "idle" | "locked"
  trackingEngine.handleIdleState(state !== "active");
});
```

### No Time Cap (V1 had 30s limit)
```typescript
// V2: No cap, accurate long sessions
const elapsed = Date.now() - startTime;  // No Math.min()!
```

---

## Testing Strategy

### Unit Tests (Vitest)
- All utility functions in `/lib/`
- StorageManager methods (mocked chrome.storage)
- Data transformation logic
- Edge cases: empty data, invalid inputs, boundaries

### Integration Tests (Vitest + Chrome API Mocks)
- TrackingEngine state transitions
- IdleDetector state handling
- DataArchiver archiving logic
- Service worker lifecycle

### Manual Testing (Each Phase)
- Load extension after each phase
- Test new functionality
- Verify data in chrome.storage (DevTools)
- Check service worker logs

### No UI Tests
Per user request, skip UI component tests. Manual testing only for UI.

---

## Key Improvements Over V1

| Issue | V1 Behavior | V2 Solution |
|-------|-------------|-------------|
| State loss | Module variables reset on SW suspend | chrome.storage.session persistence |
| Time cap | 30s max per update | No cap, idle detection prevents inflation |
| Idle tracking | Tracks when user away | 60s idle threshold stops tracking |
| Polling | 5s polling in UI and context | chrome.storage.onChanged events |
| Multi-window | Single window only | Track focused window + idle across all |
| Data growth | No cleanup | 90-day archiving policy |
| Performance | No memoization | useMemo throughout UI |
| Error handling | Silent failures | Loading/error states, ErrorBoundary |

---

## Dependencies to Add

Update `package.json`:
```json
{
  "dependencies": {
    "react-router-dom": "^7.1.0",
    "recharts": "^2.15.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "vitest": "^1.2.0",
    "@vitest/ui": "^1.2.0"
  }
}
```

---

## Success Criteria

- [ ] Extension loads without errors
- [ ] Time tracking works across service worker restarts
- [ ] Idle detection triggers at 60s and resumes on activity
- [ ] No 30s cap - long sessions tracked accurately
- [ ] UI updates instantly on background changes (no polling)
- [ ] Website blocking works correctly
- [ ] Data archives after 90 days
- [ ] All unit/integration tests pass
- [ ] No TypeScript errors in strict mode
- [ ] Production build completes successfully

---

## Estimated Timeline

- **Phase 1**: 1 day (foundation)
- **Phase 2**: 2 days (storage, idle, archiving)
- **Phase 3**: 2 days (tracking engine, service worker)
- **Phase 4**: 2 days (UI foundation, context, routing)
- **Phase 5**: 2 days (dashboard, chart, breakdown)
- **Phase 6**: 1 day (blocking feature)
- **Phase 7**: 2 days (integration, polish, testing)
- **Phase 8**: 1 day (docs, production build)

**Total: ~13 days**

---

## Next Steps

1. Install additional dependencies (`pnpm install react-router-dom recharts clsx tailwind-merge vitest`)
2. Start with Phase 1: Create type definitions and utility functions
3. Write unit tests as you build each utility
4. Proceed sequentially through phases, testing at each step
5. Commit after each phase completion

---

**End of Action Plan**
