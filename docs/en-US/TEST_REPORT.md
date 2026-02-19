# @dreamer/theme Test Report

## Overview

| Item             | Info                        |
| ---------------- | --------------------------- |
| Package version  | 1.0.0-beta.3                |
| Test framework   | @dreamer/test@1.0.0-beta.40 |
| Test date        | 2026-02-01                  |
| Test environment | Deno                        |

## Test Results

### Summary

| Metric      | Value |
| ----------- | ----- |
| Total tests | 36    |
| Passed      | 36    |
| Failed      | 0     |
| Pass rate   | 100%  |
| Duration    | 14ms  |

### Test Files

| Test file     | Tests | Passed | Failed | Status |
| ------------- | ----- | ------ | ------ | ------ |
| theme.test.ts | 36    | 36     | 0      | ✅     |

## Functional Test Details

### 1. Theme class (theme.test.ts) – 6 tests

| Scenario                                   | Status |
| ------------------------------------------ | ------ |
| Should create instance with default config | ✅     |
| Should create instance with custom config  | ✅     |
| Should toggle theme correctly              | ✅     |
| Should set theme mode correctly            | ✅     |
| Should support change callback             | ✅     |
| Should get system preference correctly     | ✅     |

### 2. createTheme function (theme.test.ts) – 1 test

| Scenario                         | Status |
| -------------------------------- | ------ |
| Should create new theme instance | ✅     |

### 3. getTheme function (theme.test.ts) – 1 test

| Scenario                       | Status |
| ------------------------------ | ------ |
| Should return global singleton | ✅     |

### 4. Strategy config (theme.test.ts) – 2 tests

| Scenario                         | Status |
| -------------------------------- | ------ |
| class strategy should be default | ✅     |
| attribute strategy should work   | ✅     |

### 5. Storage config (theme.test.ts) – 2 tests

| Scenario                               | Status |
| -------------------------------------- | ------ |
| localStorage should be default storage | ✅     |
| cookie storage should be configurable  | ✅     |

### 6. Event dispatch (theme.test.ts) – 1 test

| Scenario                           | Status |
| ---------------------------------- | ------ |
| Should dispatch theme change event | ✅     |

### 7. destroy method (theme.test.ts) – 1 test

| Scenario                  | Status |
| ------------------------- | ------ |
| Should clean up resources | ✅     |

### 8. Global functions (theme.test.ts) – 5 tests

| Scenario                                    | Status |
| ------------------------------------------- | ------ |
| toggleTheme should toggle theme             | ✅     |
| setThemeMode should set mode                | ✅     |
| getAppliedTheme should return current theme | ✅     |
| getThemeMode should return current mode     | ✅     |
| destroyTheme should destroy global instance | ✅     |

### 9. Config options (theme.test.ts) – 6 tests

| Scenario                                  | Status |
| ----------------------------------------- | ------ |
| darkClass should be configurable          | ✅     |
| lightClass should be configurable         | ✅     |
| selector should be configurable           | ✅     |
| disableTransition should be configurable  | ✅     |
| transitionDuration should be configurable | ✅     |
| storageKey should be configurable         | ✅     |

### 10. Edge cases (theme.test.ts) – 5 tests

| Scenario                                         | Status |
| ------------------------------------------------ | ------ |
| Same theme set should not trigger callback       | ✅     |
| Multiple callbacks should all be invoked         | ✅     |
| Callback error should not affect other callbacks | ✅     |
| Empty config should use defaults                 | ✅     |
| media strategy should be configurable            | ✅     |

### 11. Custom transition CSS (theme.test.ts) – 4 tests

| Scenario                                                | Status |
| ------------------------------------------------------- | ------ |
| transitionCSS should be configurable                    | ✅     |
| persistTransitionCSS should be configurable             | ✅     |
| Temporary transition CSS should be removed after toggle | ✅     |
| Persistent transition CSS should be removed on destroy  | ✅     |

### 12. DOM cache (theme.test.ts) – 2 tests

| Scenario                              | Status |
| ------------------------------------- | ------ |
| Should cache DOM element correctly    | ✅     |
| Cache should be cleared after destroy | ✅     |

## Coverage Analysis

### Core types

| Class/function  | Coverage |
| --------------- | -------- |
| Theme class     | ✅       |
| createTheme     | ✅       |
| getTheme        | ✅       |
| toggleTheme     | ✅       |
| setThemeMode    | ✅       |
| getAppliedTheme | ✅       |
| getThemeMode    | ✅       |
| destroyTheme    | ✅       |

### Methods

| Method                | Coverage |
| --------------------- | -------- |
| getMode()             | ✅       |
| getAppliedTheme()     | ✅       |
| setMode()             | ✅       |
| toggle()              | ✅       |
| onChange()            | ✅       |
| getSystemPreference() | ✅       |
| destroy()             | ✅       |

### Strategies

| Strategy  | Coverage |
| --------- | -------- |
| class     | ✅       |
| attribute | ✅       |
| media     | ✅       |

### Storage

| Storage type | Coverage |
| ------------ | -------- |
| localStorage | ✅       |
| cookie       | ✅       |

### Config options

| Option               | Coverage |
| -------------------- | -------- |
| defaultMode          | ✅       |
| strategy             | ✅       |
| darkClass            | ✅       |
| lightClass           | ✅       |
| attribute            | ✅       |
| selector             | ✅       |
| storageKey           | ✅       |
| storageType          | ✅       |
| cookieExpireDays     | ✅       |
| disableTransition    | ✅       |
| transitionDuration   | ✅       |
| transitionCSS        | ✅       |
| persistTransitionCSS | ✅       |

### Edge cases

| Case                        | Coverage |
| --------------------------- | -------- |
| Default config              | ✅       |
| Custom config               | ✅       |
| Empty config                | ✅       |
| Multiple toggles            | ✅       |
| Same theme set              | ✅       |
| Callback unsubscribe        | ✅       |
| Multiple callbacks          | ✅       |
| Callback error handling     | ✅       |
| Global singleton            | ✅       |
| Global destroy and recreate | ✅       |

## Strengths

1. **Lightweight**: Focused on dark mode switching with no extra code.
2. **Framework support**: Works with TailwindCSS and UnoCSS.
3. **Flexible strategies**: class, attribute, and media.
4. **Flexible storage**: localStorage and cookie.
5. **System preference**: Detects and follows system dark mode.
6. **Event-driven**: Callbacks and CustomEvent.
7. **Resilient**: Callback errors do not affect other callbacks.
8. **Typed**: Full TypeScript types.
9. **Custom transition**: Custom transition CSS, temporary or persistent.
10. **Performance**: DOM query caching to avoid repeated lookups.

## Conclusion

All 36 tests for @dreamer/theme pass. Coverage includes public API, config
options, strategies, storage, custom transition, DOM cache, and edge cases. The
package is minimal and focused on dark mode switching for TailwindCSS and
UnoCSS, with flexible options and a clear API.

---

**中文版**：[docs/zh-CN/TEST_REPORT.md](../zh-CN/TEST_REPORT.md)
