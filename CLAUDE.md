# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusExpo is a React Native mobile application built with Expo that helps users manage focus time and block distracting apps. The app uses iOS Screen Time API for app blocking functionality and supports complex scheduling patterns for focus plans.

## Essential Commands

```bash
# Development
bun install              # Install dependencies (uses Bun package manager)
expo start              # Start development server
expo start -c           # Clear cache and start server
expo run:ios            # Run on iOS device
expo run:android        # Run on Android device
expo start --web        # Run web version

# Code Quality
expo lint               # Run ESLint

# Cache Clearing (when Metro bundler issues occur)
watchman watch-del-all
rm -rf node_modules/.cache
expo start -c
```

## Architecture Overview

### Routing Structure
The app uses Expo Router v5 with file-based routing:
- `app/(tabs)/` - Main tab navigation (Home, Record, Challenges, User)
- `app/plans/` - Focus plan management screens
- `app/apps/` - App management for blocking
- `app/setting/` - Settings screens

### State Management
Uses Zustand with combine pattern. Each feature has its own store:
- `usePlanStore` - Focus plans and scheduling logic
- `useAppStore` - iOS app management and blocking state
- `useRecordStore` - Focus records and statistics
- `useUserStore` - User authentication and profile
- `useChallengeStore` - Challenge system

### Key Architectural Patterns

1. **Focus Timer Implementation**: Chain-based timer with drift prevention, synchronizing between JS and native iOS modules
2. **App Blocking**: iOS native module integration using Screen Time API with VPN-based restrictions
3. **Storage Strategy**: MMKV for performance-critical data, AsyncStorage for user preferences
4. **Theme System**: Dual theme (light/dark) with CSS variables and NativeWind styling

### Critical Files
- `src/stores/plan.ts` - Core focus plan logic with repeat patterns
- `src/utils/permission.ts` - iOS Screen Time permission handling
- `src/utils/request.ts` - API request wrapper with interceptors
- `app/_layout.tsx` - Global providers and native event listeners

### Development Notes

1. **Package Manager**: Uses Bun (not npm/yarn). Configuration in `.bunfig.toml`
2. **Styling**: Uses NativeWind (Tailwind for React Native). Custom theme tokens in `src/config/theme.ts`
3. **Native Modules**: iOS app blocking requires proper entitlement configuration
4. **TypeScript**: Strict mode enabled with path aliases (`@/*` → `./src/*`)
5. **No Testing Framework**: Project currently has no test setup

### Common Development Tasks

When modifying focus timer logic:
- Check `src/stores/plan.ts` for timer implementation
- Review native module integration in `src/native/ios/` for iOS-specific behavior
- Test timer accuracy across pause/resume cycles

When working with app blocking:
- iOS permissions must be requested before blocking functionality
- App list is managed through `useAppStore` with native iOS integration
- Blocking state persists across app launches

When adding new screens:
- Follow Expo Router file-based routing conventions
- Place route files in appropriate directories under `app/`
- Use existing UI components from `src/components/ui/`