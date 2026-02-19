# @dreamer/theme

Lightweight theme switching for TailwindCSS and UnoCSS.

**中文**：[README (zh-CN)](./docs/zh-CN/README.md) · **Test report (EN)**:
[docs/en-US/TEST_REPORT.md](./docs/en-US/TEST_REPORT.md)

[![JSR](https://jsr.io/badges/@dreamer/theme)](https://jsr.io/@dreamer/theme)
[![License: Apache-2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/tests-36%20passed-green)](./docs/en-US/TEST_REPORT.md)

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
  - media (CSS media query only)

- **Persistence**
  - localStorage (default)
  - Cookie

- **Events**
  - Change callbacks
  - CustomEvent for theme change

- **Other**
  - System preference detection
  - Transition control
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

| Option               | Type                                | Default          | Description                |
| -------------------- | ----------------------------------- | ---------------- | -------------------------- |
| defaultMode          | `"light" \| "dark" \| "system"`     | `"system"`       | Default mode               |
| strategy             | `"class" \| "attribute" \| "media"` | `"class"`        | Strategy                   |
| darkClass            | `string`                            | `"dark"`         | Class for dark             |
| lightClass           | `string`                            | `""`             | Class for light            |
| attribute            | `string`                            | `"data-theme"`   | HTML attribute name        |
| selector             | `string`                            | `"html"`         | Selector to apply theme    |
| storageKey           | `string`                            | `"theme"`        | Storage key                |
| storageType          | `"localStorage" \| "cookie"`        | `"localStorage"` | Storage type               |
| cookieExpireDays     | `number`                            | `365`            | Cookie expiry (days)       |
| disableTransition    | `boolean`                           | `false`          | Disable transition         |
| transitionDuration   | `number`                            | `200`            | Duration (ms)              |
| transitionCSS        | `string`                            | `""`             | Custom transition CSS      |
| persistTransitionCSS | `boolean`                           | `false`          | Keep transition CSS in DOM |

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

| Metric      | Value      |
| ----------- | ---------- |
| Test date   | 2026-02-01 |
| Total tests | 36         |
| Passed      | 36         |
| Failed      | 0          |
| Pass rate   | 100%       |

See [TEST_REPORT.md](docs/en-US/TEST_REPORT.md) for details.

---

## Changelog

**[1.0.0]** - 2026-02-20

- **Added**: Initial stable release. Theme modes (light / dark / system),
  strategies (class / attribute / media), localStorage and cookie storage, full
  API and options, CustomEvent, TypeScript types. See
  [docs/en-US/CHANGELOG.md](docs/en-US/CHANGELOG.md) for full history.

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
