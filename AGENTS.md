# Surf Track - Chrome Extension Project

## Project Overview

**Surf Track** is a Chrome extension for automatic website time tracking. The repository contains:
- **v1/**: Original implementation (reference for UI/UX and functionality)
- **v2/**: (To be built) Enhanced version with improved accuracy and robustness

This document provides context for AI agents and developers working on this codebase.

---

## v1 Architecture Reference

### Tech Stack
- **Frontend**: React 19 + TypeScript 5.7
- **Build Tool**: Vite 6.1 with hot reload plugin
- **UI Framework**: Tailwind CSS 3.4 + shadcn/ui (Radix UI primitives)
- **Charts**: Recharts 2.15
- **Routing**: React Router 7.1 (MemoryRouter for popup)
- **Extension**: Chrome Manifest V3 (Service Worker architecture)

### Data Model

```typescript
type ScreenTimeData = {
  [yearWeek: string]: {        // "2026_01" format
    [date: string]: {           // "2026-01-04" ISO format
      [domain: string]: {
        time: number;           // Seconds
        favicon?: string;       // Optional favicon URL
      }
    }
  }
}
```

**Storage Keys**:
- `screenTimeData`: Complete time tracking dataset
- `blockedDomains`: Array of blocked domain strings

### Component Structure

```
popup.tsx (MemoryRouter)
├── Dashboard
│   ├── TopBar (navigation)
│   └── ScreenTime
│       ├── ScreenTimeChart (weekly bar chart)
│       └── DailyScreenTimeBreakdown (domain list)
└── Blocked (blocking management)
```

### State Management Pattern

**Global State**: React Context API
- Provider: `GlobalProvider` polls chrome.storage every 5s
- Consumer: `useGlobalContext()` hook
- No Redux/Zustand - simple context for read-only data

**Local State**: Component-level useState for UI state

### Time Tracking Algorithm (v1)

**Approach**: Session-based tracking
1. Track active tab with module-level variables (currentUrl, startTime)
2. On tab change: save elapsed time (capped at 30s per update)
3. Periodic saves: Every 15s via chrome.alarms
4. Data structure: Nested by year_week → date → domain

**Key Constants**:
- `MAX_TIME_SPENT`: 30 seconds (prevents anomalies from idle time)
- `ALARM_INTERVAL`: 0.25 minutes (15 seconds)
- `POLL_INTERVAL`: 5000ms (UI data refresh)

**Ignored Domains**: newtab, extensions, localhost, settings, about:blank

### File Locations (v1)

**Critical Files**:
- `v1/extension/src/background/index.ts`: Time tracking logic + Chrome API integration
- `v1/extension/src/types/types.ts`: TypeScript definitions
- `v1/extension/src/lib/functions.ts`: Data transformation utilities
- `v1/extension/public/manifest.json`: Chrome extension configuration

**Key Components**:
- `v1/extension/src/components/screen-time.tsx`: Main view controller
- `v1/extension/src/components/screen-time-chart.tsx`: Weekly visualization
- `v1/extension/src/components/blocked.tsx`: Website blocking

**Context**:
- `v1/extension/src/context/global-context.tsx`: Data provider with polling

---

## v1 Limitations & Improvement Opportunities

### Accuracy Issues
1. **Service Worker Lifecycle**: Module-level state resets when service worker terminates
   - Variables (currentUrl, startTime) lost on restart
   - Gaps in tracking when Chrome suspends service worker
   - **v2 Solution**: Persist tracking state to storage

2. **30-Second Cap**: Limits max tracked time per update
   - Underreports long-focused sessions
   - Combined with 15s alarms = max 45s theoretical tracking
   - **v2 Solution**: Use chrome.idle API to detect actual activity

3. **No Idle Detection**: Tracks time even when user is away
   - Inflates time counts if browser left open
   - idle permission requested but never used
   - **v2 Solution**: Implement idle state detection

4. **Single-Window Only**: Only tracks focused window
   - Multiple windows = incomplete data
   - **v2 Solution**: Track all windows with activity detection

### Performance & Data Management
1. **No Data Cleanup**: Data grows indefinitely
   - Storage bloat over time
   - No archiving or retention policy
   - **v2 Solution**: Implement data retention (e.g., keep 3 months)

2. **Redundant Polling**: Two 5-second polling layers
   - Context polls storage
   - ScreenTime polls context
   - **v2 Solution**: Use chrome.storage.onChanged event listener

3. **Inefficient Iteration**: extractAllDomains() iterates entire dataset
   - O(n × m × k) complexity
   - No memoization
   - **v2 Solution**: Cache domain list, update on changes only

### UX Gaps
1. **No Loading States**: UI flashes empty briefly on mount
2. **No Error Messages**: Silent failures in storage/favicon loading
3. **Limited Date Navigation**: Can only move week-by-week
4. **No Export/Import**: Can't backup or transfer data
5. **No Customization**: No categories, tags, or time goals

### Code Quality
1. **Mixed Async Patterns**: Callbacks vs async/await
2. **No Tests**: Manual testing only
3. **Inconsistent File Naming**: kebab-case vs PascalCase
4. **Hard-coded Values**: Magic numbers throughout

---

## Development Guidelines for v2

### Architecture Principles
1. **Robust State Management**
   - Persist tracking state to chrome.storage.session (survives service worker restarts)
   - Event-driven updates (chrome.storage.onChanged) instead of polling
   - Consider Zustand or Redux Toolkit for complex UI state

2. **Accurate Time Tracking**
   - Implement idle detection (chrome.idle.queryState)
   - Remove 30s cap, use idle detection instead
   - Track multiple windows with activity heuristics
   - Save state on every critical event (not just alarms)

3. **Performance First**
   - Memoize expensive computations (useMemo, useCallback)
   - Virtual scrolling for long lists
   - Efficient data structures (consider IndexedDB for large datasets)
   - Cache derived data (domain lists, chart data)

4. **User Experience**
   - Loading states for all async operations
   - Error boundaries and user-facing error messages
   - Comprehensive date navigation (calendar picker)
   - Export/import functionality
   - Customization: categories, tags, goals, alerts

5. **Developer Experience**
   - Tests: Vitest for units, Playwright for E2E
   - Consistent async/await patterns
   - Strict TypeScript (no any, optional chaining only when needed)
   - Named constants for all magic numbers
   - Consistent file naming (kebab-case for all)

### Chrome Extension Best Practices

**Service Worker Patterns**:
- Never rely on module-level variables for state
- Persist state to chrome.storage.session or chrome.storage.local
- Use chrome.alarms for scheduled tasks (not setInterval)
- Handle onSuspend event to save state before termination

**Storage Strategies**:
- Use chrome.storage.onChanged for reactive updates
- Batch writes to minimize I/O
- Consider compression for historical data
- Implement data retention policy

**Permissions**:
- Request minimum necessary permissions
- Document why each permission is needed
- Consider optional permissions for advanced features

### UI Component Patterns (from v1)

**shadcn/ui Standards**:
- Copy components from shadcn/ui, don't install as package
- Use Radix UI primitives for accessibility
- Follow Tailwind + CSS variables theming pattern
- Maintain consistent variants across components

**Chart Visualization**:
- Recharts for consistency with v1
- Custom tooltips with formatted durations
- Interactive elements with clear hover states
- Responsive design (fixed popup size: 500×600px)

**Forms & Inputs**:
- Real-time validation where appropriate
- Debounced search inputs
- Accessible labels (Radix UI Label)
- Clear error states

---

## Working with This Codebase

### For AI Agents

**When exploring v1**:
- Reference `/Volumes/ExternalSSD/Projects/personal-projects/flagship/chrome-plugins/surf-track/v1/extension/` for all v1 code
- UI/UX inspiration: Look at shadcn/ui component usage, Tailwind patterns
- Time tracking logic: Study `background/index.ts` thoroughly
- Data transformations: Check `lib/functions.ts` for date/time utilities

**When building v2**:
- Create new structure in `/Volumes/ExternalSSD/Projects/personal-projects/flagship/chrome-plugins/surf-track/v2/`
- Reference v1 for UI patterns, but improve architecture
- Address all limitations listed above
- Follow development guidelines strictly
- Write tests from the start (TDD when possible)

**Critical Files to Reference**:
1. `v1/extension/src/background/index.ts` - Time tracking implementation
2. `v1/extension/src/types/types.ts` - Data model definitions
3. `v1/extension/src/lib/functions.ts` - Utility functions
4. `v1/extension/src/components/screen-time-chart.tsx` - Chart patterns
5. `v1/extension/public/manifest.json` - Extension configuration

### For Human Developers

**Getting Started with v1**:
```bash
cd v1/extension
pnpm install
pnpm dev          # Development with hot reload
pnpm build        # Production build to v1/extension/build/
```

**Loading Extension**:
1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `v1/extension/build/` folder

**Development Workflow**:
- Hot reload enabled via hot-reload-extension-vite
- Changes auto-refresh extension in development mode
- Check console in popup (right-click → Inspect)
- Check service worker logs in chrome://extensions/ → Details → Service Worker

### Common Tasks

**Add New UI Component**:
1. Copy from shadcn/ui if needed: `npx shadcn-ui@latest add <component>`
2. Place in `src/components/ui/`
3. Use Tailwind + CSS variables for styling
4. Follow existing component patterns

**Modify Time Tracking**:
1. Edit `src/background/index.ts`
2. Update types in `src/types/types.ts` if needed
3. Test with rapid tab switching, idle time, window changes
4. Verify data in chrome.storage (use DevTools → Application → Storage)

**Add New Chart/Visualization**:
1. Study `screen-time-chart.tsx` pattern
2. Use Recharts for consistency
3. Transform data in utility function (lib/functions.ts)
4. Memoize expensive transformations

---

## v2 Planning Considerations

### MVP Features (Parity with v1 + Improvements)
- [ ] Accurate time tracking (with idle detection)
- [ ] Weekly bar chart visualization
- [ ] Daily domain breakdown
- [ ] Website blocking
- [ ] Service worker state persistence
- [ ] Multi-window tracking
- [ ] Loading states throughout
- [ ] Error handling with user feedback

### Enhanced Features (Beyond v1)
- [ ] Export/import data (JSON/CSV)
- [ ] Calendar date picker
- [ ] Domain categories/tags
- [ ] Time goals and alerts
- [ ] Temporary/scheduled blocking
- [ ] Productivity insights
- [ ] Data retention policy
- [ ] Search/filter across all history

### Technical Improvements
- [ ] Event-driven architecture (no polling)
- [ ] IndexedDB for large datasets
- [ ] Comprehensive test coverage
- [ ] Performance monitoring
- [ ] Type-safe throughout (strict TypeScript)
- [ ] Error boundaries
- [ ] Logging and debugging tools

---

## Additional Context

### Why This Structure?

The v1/ folder preserves the original implementation for reference. Key reasons:
1. **UI/UX Consistency**: v2 should maintain the clean, simple interface
2. **Feature Baseline**: Understand what worked well in v1
3. **Migration Path**: Users may need to migrate data from v1 to v2
4. **Learning Resource**: Study patterns, understand evolution

### Design Philosophy

**v1 Philosophy**: Simple, automatic, non-intrusive tracking
- No manual timers or start/stop buttons
- Passive data collection
- Clean, minimal UI
- Focus on visualization over configuration

**v2 Philosophy**: Accurate, robust, actionable insights
- Maintain v1's simplicity
- Add accuracy and reliability
- Enable power users with advanced features
- Provide actionable productivity insights

### Chrome Extension Ecosystem

**Market Context**:
- Many time tracking extensions exist (RescueTime, Toggl Track, etc.)
- Differentiation: Simplicity + beautiful UI + accurate tracking
- Privacy-focused: All data stored locally, no cloud sync

**Technical Context**:
- Manifest V3 is the current standard (v2 deprecated)
- Service workers replace persistent background pages
- Storage quotas are generous with unlimitedStorage permission
- Chrome extensions can't access incognito by default

---

## Quick Reference

### Key Metrics (v1)
- Popup Size: 500×600px
- Alarm Interval: 15 seconds
- Max Time Per Update: 30 seconds
- UI Poll Interval: 5 seconds
- Favicon Retry: 3 attempts × 1 second

### Chrome APIs Used
- chrome.tabs (tab tracking)
- chrome.storage.local (data persistence)
- chrome.windows (window focus)
- chrome.alarms (periodic updates)
- chrome.runtime (lifecycle events)
- chrome.idle (permission only, unused in v1)

### Data Structure Sizes (Estimated)
- 1 domain per day: ~100 bytes
- 10 domains × 365 days: ~365 KB/year
- With unlimitedStorage: Practically unlimited

### Build Outputs
- `build/index.html`: Popup HTML
- `build/main.js`: Popup React app (bundled)
- `build/background.js`: Service worker
- `build/manifest.json`: Extension manifest
- `build/assets/`: CSS and asset chunks

---

## Support & Resources

### Documentation
- Chrome Extension Docs: https://developer.chrome.com/docs/extensions/
- Manifest V3 Migration: https://developer.chrome.com/docs/extensions/migrating/
- shadcn/ui: https://ui.shadcn.com/
- Recharts: https://recharts.org/

### Tools
- Chrome DevTools for Extensions
- React DevTools
- Vite DevTools

### Community
- Chrome Extension developers on Discord/Reddit
- shadcn/ui community for UI questions

---

## Notes for Future Development

### Potential Technologies
- **State Management**: Zustand (lightweight), Redux Toolkit (comprehensive)
- **Database**: IndexedDB (for large datasets), Dexie.js (IndexedDB wrapper)
- **Testing**: Vitest (unit), Playwright (E2E), @testing-library/react
- **Type Safety**: Zod (runtime validation), tRPC (if adding backend)
- **Bundling**: Vite is excellent, consider Turbopack when stable

### Performance Monitoring
- Consider adding performance tracking
- Monitor service worker restart frequency
- Track storage size growth
- Measure UI render performance

### Analytics (Optional)
- Could add privacy-respecting analytics
- Track feature usage (locally, no external calls)
- Help prioritize improvements

---

**Last Updated**: 2026-01-04
**Project Version**: v1 archived, v2 planning phase
**Maintained By**: Akshat Dubey
