# @dreamer/theme

Lightweight theme switching for TailwindCSS and UnoCSS.

**中文**：[README (zh-CN)](./docs/zh-CN/README.md) · **Test reports**:
[English](./docs/en-US/TEST_REPORT.md) · [中文](./docs/zh-CN/TEST_REPORT.md)

[![JSR](https://jsr.io/badges/@dreamer/theme)](https://jsr.io/@dreamer/theme)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-47%20passed-green)](./docs/en-US/TEST_REPORT.md)

---

## Features

Full dark mode support: light / dark / system. Compatible with TailwindCSS and
UnoCSS class and attribute strategies.

---

## Installation

**Deno**

```bash
deno add jsr:@dreamer/theme
```

**npm**

```bash
npx jsr add @dreamer/theme
```

---

## Environment support

| Environment | Supported | Notes                       |
| ----------- | --------- | --------------------------- |
| Deno        | ✅        | Full support                |
| Bun         | ✅        | Full support                |
| Node.js     | ✅        | Via JSR compatibility layer |
| Browser     | ✅        | Primary target              |

---

## Capabilities

- **Theme modes**
  - Light
  - Dark
  - System (follow OS)

- **Strategies**
  - class (TailwindCSS/UnoCSS default)
  - attribute (custom HTML attribute)
  - media (CSS media query; optional `data-*` on root for scripts via
    `mediaSyncAttribute`)

- **Persistence**
  - localStorage (default)
  - Cookie

- **Events**
  - Change callbacks
  - CustomEvent for theme change

- **Other**
  - Cookie values URL-encoded on write, decoded on read
  - System preference detection
  - Transition control (reuses one temporary `<style>` when disabling
    transitions)
  - Custom transition CSS
  - DOM query caching
  - Global singleton
  - Full TypeScript types

---

## Use cases

- Web apps that need dark mode toggle
- TailwindCSS or UnoCSS projects
- Apps that follow system preference
- Apps that persist user theme choice

---

## Quick start

### Basic usage

```typescript
import { createTheme } from "@dreamer/theme";

const theme = createTheme();

theme.toggle();

theme.setMode("dark");

theme.setMode("system");
```

### TailwindCSS

**TailwindCSS v4** (no extra config):

```typescript
const theme = createTheme();
```

**TailwindCSS v3** (config required):

```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class",
};
```

### UnoCSS

UnoCSS uses **media** by default. For **class** strategy:

```typescript
// uno.config.ts
import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno({ dark: "class" })],
});
```

If you keep the default **media** strategy, set the package to match:

```typescript
const theme = createTheme({
  strategy: "media",
});
```

### Strategy overview

| Framework   | Version | Default strategy | Config needed              |
| ----------- | ------- | ---------------- | -------------------------- |
| TailwindCSS | v4      | class            | ❌ No                      |
| TailwindCSS | v3      | media            | ✅ Set `darkMode: "class"` |
| UnoCSS      | -       | media            | ✅ Set `dark: "class"`     |

> If the framework uses **media** (follow system), set `strategy: "media"` so
> the package only handles preference detection and storage; the actual theme is
> controlled by CSS media queries.

---

## Examples

### Attribute strategy

```typescript
const theme = createTheme({
  strategy: "attribute",
  attribute: "data-theme",
});
```

### Cookie storage

```typescript
const theme = createTheme({
  storageType: "cookie",
  cookieExpireDays: 30,
});
```

### Listen to theme changes

```typescript
const unsubscribe = theme.onChange((appliedTheme, mode) => {
  console.log(`Theme: ${appliedTheme}, mode: ${mode}`);
});

unsubscribe();
```

### Listen via event

```typescript
import { THEME_CHANGE_EVENT } from "@dreamer/theme";

globalThis.addEventListener(THEME_CHANGE_EVENT, (event) => {
  const { theme, mode } = event.detail;
  console.log(`Theme: ${theme}`);
});
```

### Custom transition

```typescript
// Temporary transition CSS (injected on toggle, removed after)
const theme = createTheme({
  transitionCSS: `
    html {
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    .card, .button {
      transition: all 0.3s ease;
    }
  `,
  transitionDuration: 300,
});

// Persistent transition CSS (always in the page)
const theme = createTheme({
  transitionCSS: `
    * {
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    }
  `,
  persistTransitionCSS: true,
});
```

### Avoid flash of wrong theme

Add an inline script in `<head>`:

```html
<script>
  (function () {
    const stored = localStorage.getItem("theme");
    const prefersDark =
      window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "dark" || stored === "light"
      ? stored
      : (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  })();
</script>
```

---

## API

### createTheme(options?)

Creates a theme instance.

| Option               | Type                                | Default                                                      | Description                                                              |
| -------------------- | ----------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| defaultMode          | `"light" \| "dark" \| "system"`     | `"system"`                                                   | Default mode                                                             |
| strategy             | `"class" \| "attribute" \| "media"` | `"class"`                                                    | Strategy                                                                 |
| mediaSyncAttribute   | `string`                            | `"data-applied-theme"` when `strategy` is `media`, else `""` | Root attribute for resolved `light`/`dark` (media only); `""` to disable |
| darkClass            | `string`                            | `"dark"`                                                     | Class for dark                                                           |
| lightClass           | `string`                            | `""`                                                         | Class for light                                                          |
| attribute            | `string`                            | `"data-theme"`                                               | HTML attribute name                                                      |
| selector             | `string`                            | `"html"`                                                     | Selector to apply theme                                                  |
| storageKey           | `string`                            | `"theme"`                                                    | Storage key                                                              |
| storageType          | `"localStorage" \| "cookie"`        | `"localStorage"`                                             | Storage type                                                             |
| cookieExpireDays     | `number`                            | `365`                                                        | Cookie expiry (days)                                                     |
| disableTransition    | `boolean`                           | `false`                                                      | Disable transition                                                       |
| transitionDuration   | `number`                            | `200`                                                        | Duration (ms)                                                            |
| transitionCSS        | `string`                            | `""`                                                         | Custom transition CSS                                                    |
| persistTransitionCSS | `boolean`                           | `false`                                                      | Keep transition CSS in DOM                                               |

### ThemeInstance methods

| Method                  | Returns             | Description                    |
| ----------------------- | ------------------- | ------------------------------ |
| `getMode()`             | `ThemeMode`         | Current mode                   |
| `getAppliedTheme()`     | `"light" \| "dark"` | Applied theme                  |
| `setMode(mode)`         | `void`              | Set mode                       |
| `toggle()`              | `"light" \| "dark"` | Toggle theme                   |
| `onChange(callback)`    | `() => void`        | Subscribe; returns unsubscribe |
| `getSystemPreference()` | `"light" \| "dark"` | System preference              |
| `destroy()`             | `void`              | Destroy instance               |

### Global helpers

| Function             | Description                    |
| -------------------- | ------------------------------ |
| `getTheme(options?)` | Get or create global singleton |
| `toggleTheme()`      | Toggle theme                   |
| `setThemeMode(mode)` | Set mode                       |
| `getAppliedTheme()`  | Get current theme              |
| `getThemeMode()`     | Get current mode               |
| `destroyTheme()`     | Destroy global instance        |

### Types

```typescript
import type {
  DarkModeStrategy,
  ThemeChangeEventDetail,
  ThemeInstance,
  ThemeMode,
  ThemeOptions,
} from "@dreamer/theme";
```

---

## Test report

| Metric      | Value                      |
| ----------- | -------------------------- |
| Test date   | 2026-03-22                 |
| Total tests | 47 (`deno test -A tests/`) |
| Passed      | 47                         |
| Failed      | 0                          |
| Pass rate   | 100%                       |

- **Full suite (Deno)**: `deno test -A tests/` — 37 unit
  (`tests/theme.test.ts`) + 10 browser file registrations
  (`tests/browser/theme-browser.test.ts`, real Chromium).
- **Browser only**: `deno task test:browser`.
- **Bun**: `bun test tests/` (see `package.json`; may report 46 cases depending
  on how hooks are counted).

Details: [TEST_REPORT (EN)](docs/en-US/TEST_REPORT.md) ·
[测试报告 (中文)](docs/zh-CN/TEST_REPORT.md).

> One unit test intentionally triggers a throwing `onChange` callback; the
> library logs `[Theme] Callback error` and the test still passes.

---

## Changelog

**[1.0.1]** - 2026-03-24

- **Added**: `mediaSyncAttribute` for `strategy: "media"` — mirror resolved
  `light`/`dark` on the root (default `data-applied-theme`; `""` to disable).
- **Changed**: Cookie values written with `encodeURIComponent` / read with
  `decodeURIComponent`; reused `MediaQueryList` for system preference;
  `onChange` iteration uses a callback snapshot; temporary no-transition CSS
  reuses one `<style>`; `destroy()` clears mirror attribute and no-transition
  state.
- **Fixed**: Cookie parsing without regex built from `storageKey`.
- **Docs / tests**: Browser (Playwright) tests, updated EN/zh test reports and
  README. Full history: [docs/en-US/CHANGELOG.md](docs/en-US/CHANGELOG.md) ·
  [docs/zh-CN/CHANGELOG.md](docs/zh-CN/CHANGELOG.md).

---

## Notes

1. **Flash**: Use the inline script in `<head>` so the theme is applied before
   first paint.
2. **System**: `system` mode listens to `prefers-color-scheme` changes.
3. **Storage**: Stored theme overrides default mode.
4. **Cleanup**: Call `destroy()` to remove listeners.

---

## Contributing

Issues and Pull Requests are welcome.

---

## License

[Apache-2.0](./LICENSE)

---

Made with ❤️ by Dreamer Team
