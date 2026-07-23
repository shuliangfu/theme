# @dreamer/theme Test Report

## Overview

| Item             | Info                                                                  |
| ---------------- | --------------------------------------------------------------------- |
| Package version  | 1.1.0                                                                 |
| Test framework   | @dreamer/test@^1.2.3                                                  |
| Test date        | 2026-07-23                                                            |
| Test environment | Deno 2.9+, Bun 1.3+, Node.js 22+ (Linux/macOS/Windows); Chromium (Playwright) for browser tests |

## How to run

| Command                              | Scope                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------- |
| `deno test -A tests/theme.test.ts`   | **Unit tests** (CI, all three runtimes use this file)                  |
| `deno task test:browser`             | Browser tests only (`tests/browser/`, Playwright Chromium)             |
| `deno test -A tests/`                | Full suite (unit + browser), Deno only                                 |
| `bun test tests/theme.test.ts`       | Unit tests under Bun                                                   |
| `npm run test:node`                  | Unit tests under Node.js (`tsx --test --test-force-exit`)              |

> **CI vs local**: CI runs `tests/theme.test.ts` (unit) across Deno/Bun/Node.
> Browser tests (`tests/browser/`) require Chromium and run locally via
> `deno task test:browser`; they are excluded from CI.

## Test Results

### Summary

| Runtime  | Total tests | Passed | Failed | Pass rate |
| -------- | ----------- | ------ | ------ | --------- |
| **Deno** | 37          | 37 ✅  | 0      | 100%      |
| **Bun**  | 36          | 36 ✅  | 0      | 100%      |
| **Node** | 36          | 36 ✅  | 0      | 100%      |

- **Execution time**: ~7ms (Deno), ~31ms (Bun), ~163ms (Node).
- Deno reports one extra count: `@dreamer/test cleanup browsers` lifecycle step
  (browser cleanup hook). Bun/Node count only the 36 `it()` cases.

### Test files

| Test file                             | Tests | CI? | Status |
| ------------------------------------- | ----- | --- | ------ |
| `tests/theme.test.ts`                 | 36    | ✅  | ✅     |
| `tests/browser/theme-browser.test.ts` | 10    | ❌ (local) | ✅ |

The browser file registers **8** scenario tests plus **suite lifecycle** steps
(e.g. `beforeAll` / `afterAll`) as counted tests under `@dreamer/test`, for
**10** total in Deno.

## Functional details

### 1. Theme class (`theme.test.ts`) – 6 tests

| Scenario                            | Status |
| ----------------------------------- | ------ |
| Create instance with default config | ✅     |
| Create instance with custom config  | ✅     |
| Toggle theme correctly              | ✅     |
| Set theme mode correctly            | ✅     |
| Support change callback             | ✅     |
| Get system preference correctly     | ✅     |

### 2. `createTheme` (`theme.test.ts`) – 1 test

| Scenario                  | Status |
| ------------------------- | ------ |
| Create new theme instance | ✅     |

### 3. `getTheme` (`theme.test.ts`) – 1 test

| Scenario                | Status |
| ----------------------- | ------ |
| Return global singleton | ✅     |

### 4. Strategy config (`theme.test.ts`) – 2 tests

| Scenario                  | Status |
| ------------------------- | ------ |
| class strategy is default | ✅     |
| attribute strategy works  | ✅     |

### 5. Storage config (`theme.test.ts`) – 2 tests

| Scenario                        | Status |
| ------------------------------- | ------ |
| localStorage is default storage | ✅     |
| Cookie storage is configurable  | ✅     |

### 6. Event dispatch (`theme.test.ts`) – 1 test

| Scenario                    | Status |
| --------------------------- | ------ |
| Dispatch theme change event | ✅     |

### 7. `destroy` (`theme.test.ts`) – 1 test

| Scenario           | Status |
| ------------------ | ------ |
| Clean up resources | ✅     |

### 8. Global helpers (`theme.test.ts`) – 5 tests

| Scenario                        | Status |
| ------------------------------- | ------ |
| `toggleTheme` toggles theme     | ✅     |
| `setThemeMode` sets mode        | ✅     |
| `getAppliedTheme` returns theme | ✅     |
| `getThemeMode` returns mode     | ✅     |
| `destroyTheme` destroys global  | ✅     |

### 9. Config options (`theme.test.ts`) – 6 tests

| Scenario                          | Status |
| --------------------------------- | ------ |
| `darkClass` configurable          | ✅     |
| `lightClass` configurable         | ✅     |
| `selector` configurable           | ✅     |
| `disableTransition` configurable  | ✅     |
| `transitionDuration` configurable | ✅     |
| `storageKey` configurable         | ✅     |

### 10. Edge cases (`theme.test.ts`) – 5 tests

| Scenario                                 | Status |
| ---------------------------------------- | ------ |
| Same theme set does not trigger callback | ✅     |
| Multiple callbacks all invoked           | ✅     |
| Callback error does not affect others    | ✅     |
| Empty config uses defaults               | ✅     |
| media strategy configurable              | ✅     |

### 11. Custom transition CSS (`theme.test.ts`) – 4 tests

| Scenario                                      | Status |
| --------------------------------------------- | ------ |
| `transitionCSS` configurable                  | ✅     |
| `persistTransitionCSS` configurable           | ✅     |
| Temporary transition CSS removed after toggle | ✅     |
| Persistent transition CSS removed on destroy  | ✅     |

### 12. DOM cache (`theme.test.ts`) – 2 tests

| Scenario                    | Status |
| --------------------------- | ------ |
| Cache DOM element correctly | ✅     |
| Cache cleared after destroy | ✅     |

### 13. Browser tests (`tests/browser/theme-browser.test.ts`) – 8 scenarios

Runs in real Chromium via `@dreamer/test` + local HTTP origin for cookie APIs
(file:// cookies are unreliable).

| Scenario                                                                           | Status |
| ---------------------------------------------------------------------------------- | ------ |
| `setCookie` encodes values (`encodeURIComponent`; semicolons safe)                 | ✅     |
| `getCookie` decodes persisted mode                                                 | ✅     |
| Invalid stored mode falls back to `defaultMode`                                    | ✅     |
| `strategy: "media"` sets default `data-applied-theme`; removed on destroy          | ✅     |
| `mediaSyncAttribute: ""` skips DOM mirror                                          | ✅     |
| Custom `mediaSyncAttribute` name                                                   | ✅     |
| `strategy: "class"` does not set `data-applied-theme`                              | ✅     |
| Rapid toggles reuse a single `style[data-theme-no-transition]`; cleanup on destroy | ✅     |

## Coverage analysis

### Core API

| Export            | Coverage |
| ----------------- | -------- |
| `Theme`           | ✅       |
| `createTheme`     | ✅       |
| `getTheme`        | ✅       |
| `toggleTheme`     | ✅       |
| `setThemeMode`    | ✅       |
| `getAppliedTheme` | ✅       |
| `getThemeMode`    | ✅       |
| `destroyTheme`    | ✅       |

### Options (high level)

| Area                                      | Coverage     |
| ----------------------------------------- | ------------ |
| Strategies (class / attribute / media)    | ✅           |
| `mediaSyncAttribute` (media + DOM mirror) | ✅ (browser) |
| Storage (localStorage / cookie)           | ✅           |
| Cookie encode/decode symmetry             | ✅ (browser) |
| Transition / `disableTransition`          | ✅           |
| DOM cache / destroy cleanup               | ✅           |

## Conclusion

All **36** unit tests pass across Deno, Bun, and Node.js (Deno reports 37
including its `cleanup browsers` lifecycle hook). Unit tests cover the public
API across all three runtimes; browser tests (local, Playwright) cover real
`document.cookie`, `data-*` mirroring for `media` strategy, and transition
style node reuse. The package remains focused on TailwindCSS / UnoCSS dark mode
with typed options and flexible storage.

---

**中文版**：[docs/zh-CN/TEST_REPORT.md](../zh-CN/TEST_REPORT.md)
