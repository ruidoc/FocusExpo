# Repository Guidelines

## Project Structure & Module Organization
Expo Router screens live under `app/`, grouped by feature (e.g. `(tabs)`, `apps/`, `quick-start/`, `plans/`). Shared logic stays in `src/`, with UI primitives in `src/components/ui`, Zustand stores in `src/stores`, config values in `src/config`, and cross-cutting helpers in `src/utils`. Static assets and icons live in `src/assets`, while shared TypeScript definitions reside in `types/`. Docs and product notes are kept in `docs/`; update them when adding user-facing flows.

## Build, Test, and Development Commands
Install dependencies with `bun install` so `bun.lock` stays authoritative; fall back to `npm install` only if Bun is unavailable. Run `bun run start` to launch the Metro dev server, `bun run android` or `bun run ios` for native builds, and `bun run web` for browser previews. Use `bun run lint` before every PR to apply the Expo ESLint config, and call `bun run reset-project` when caches cause Metro issues.

## Coding Style & Naming Conventions
We ship strict TypeScript; prefer typed functional components and keep hooks prefixed with `use`. Use 2-space indentation, trailing commas, and explicit return types on exported APIs. Import shared code through the `@/` alias instead of relative `../../` paths. Component files and directories use PascalCase (`ButtonSheet.tsx`), while utility modules stay in camelCase. Tailwind class composition is handled through NativeWind—keep frequently reused class lists in `src/styles/` and sort class tokens logically (layout → spacing → color). Run `bun run lint` and allow the Prettier Tailwind plugin to normalize ordering.

## Testing Guidelines
Automated tests are not yet wired up; new features should bring Jest + `@testing-library/react-native` coverage alongside the code. Place specs beside the component as `*.test.tsx` or under `src/__tests__/feature-name/`. When adding tests, create a `test` script in `package.json` (e.g. `jest --watch`) and document manual QA steps in the PR until the suite is stable. Always verify the primary user journey in Expo Go or a development build before requesting review.

## Commit & Pull Request Guidelines
Commits follow Conventional Commits (`feat:`, `fix:`, `chore:`) with succinct Chinese or bilingual summaries, as seen in recent history. Squash trivial WIP commits. Every PR must describe the change, reference related issues or product docs, and list validation steps (`bun run lint`, platform smoke tests). Attach screenshots or screen recordings for UI updates, and flag any remaining TODOs or follow-ups in the PR description.
