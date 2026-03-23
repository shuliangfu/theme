# Changelog

All notable changes to @dreamer/theme are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [1.0.1] - 2026-03-24

### Added

- **`mediaSyncAttribute` (`ThemeOptions`)** – When `strategy` is `"media"`, the
  resolved applied theme (`"light"` | `"dark"`) can be mirrored on the root
  element (matched by `selector`) as an HTML attribute for scripts and
  observability. Default attribute name is `data-applied-theme` when using media
  strategy; set `mediaSyncAttribute` to `""` to disable. Class and attribute
  strategies do **not** write this mirror, and non-media strategies do not
  remove arbitrary attributes (avoids wiping unrelated `data-*` set by the host
  page).

### Changed

- **Cookie persistence** – `setCookie` now stores values with
  `encodeURIComponent`, and `getCookie` decodes with `decodeURIComponent`, so
  future or custom values containing characters such as `;` remain one logical
  cookie value. Plain ASCII mode strings remain readable; legacy cookies without
  encoding still decode safely where possible.

- **`prefers-color-scheme` handling** – In browsers, a single `MediaQueryList`
  for `(prefers-color-scheme: dark)` is created early and reused for
  `getSystemPreference`, initial resolution, and the `change` listener, reducing
  redundant `matchMedia` calls.

- **`onChange` / event dispatch** – Callbacks are invoked from a snapshot of the
  subscription set so that registering or unsubscribing inside a callback does
  not break iteration.

- **Temporary “no transition” injection** – When using the built-in path that
  temporarily disables CSS transitions (no custom `transitionCSS`), the library
  reuses one `<style data-theme-no-transition>` element in `document.head`
  instead of creating a new node on every rapid toggle; overlapping timers are
  cleared so a fast sequence of theme changes does not leave multiple stray
  tags. `destroy()` removes that style element and clears pending timers.

- **`destroy()` cleanup** – Also clears the media mirror attribute when it was
  set under `strategy: "media"` with a non-empty `mediaSyncAttribute`, and
  performs the no-transition style cleanup described above.

### Fixed

- **Cookie parsing** – Cookie reads use `;`-splitting and prefix matching
  instead of building a regular expression from `storageKey`, avoiding edge
  cases when the key contains regex metacharacters.

### Documentation & tests

- **Tests** – 37 unit tests (`tests/theme.test.ts`) plus Playwright-backed
  browser tests (`tests/browser/theme-browser.test.ts`) covering real
  `document.cookie` (via a local `http://127.0.0.1` fixture),
  `mediaSyncAttribute` behaviour, and single-node reuse for
  `data-theme-no-transition`. Full suite: `deno test -A tests/`.

- **Docs** – English and Chinese test reports and README updates (test counts,
  run instructions, `mediaSyncAttribute` in API tables).

### Packaging (Bun / npm metadata)

- **`package.json`** – Version aligned with `deno.json`; optional `dependencies`
  / `devDependencies` for running the same tests under Bun
  (`@dreamer/runtime-adapter`, `@dreamer/esbuild`, `@dreamer/test`) where the
  npm/JSR bridge is available.

---

## [1.0.0] - 2026-02-20

### Added

Initial stable release. Lightweight client-side theme switching for TailwindCSS
and UnoCSS.

#### Theme modes

- **light** – Force light theme.
- **dark** – Force dark theme.
- **system** – Follow OS `prefers-color-scheme` (default).

#### Strategies

- **class** (default) – Toggle a CSS class on the root element (e.g. `dark` for
  TailwindCSS/UnoCSS).
- **attribute** – Set an HTML attribute (e.g. `data-theme="dark"`).
- **media** – No DOM change; only read/store preference; theme is controlled by
  CSS media query.

#### Storage

- **localStorage** (default) – Persist mode under a configurable key.
- **cookie** – Optional cookie storage with configurable expiry
  (`cookieExpireDays`).

#### API

- **createTheme(options?)** – Create a theme instance with optional config.
- **Theme** class:
  - **getMode()** – Current mode (light | dark | system).
  - **getAppliedTheme()** – Resolved theme (light | dark).
  - **setMode(mode)** – Set mode and persist.
  - **toggle()** – Switch between light and dark.
  - **onChange(callback)** – Subscribe to theme changes; returns unsubscribe.
  - **getSystemPreference()** – Current OS preference (light | dark).
  - **destroy()** – Remove listeners and cleanup.
- **Global helpers**: **getTheme(options?)**, **toggleTheme()**,
  **setThemeMode(mode)**, **getAppliedTheme()**, **getThemeMode()**,
  **destroyTheme()**.

#### Configuration options (ThemeOptions)

- **defaultMode** – Default theme mode (default: `"system"`).
- **strategy** – `"class"` | `"attribute"` | `"media"` (default: `"class"`).
- **darkClass** – Class name for dark (default: `"dark"`).
- **lightClass** – Class name for light (default: `""`).
- **attribute** – Attribute name for attribute strategy (default:
  `"data-theme"`).
- **selector** – Selector for the element to apply theme (default: `"html"`).
- **storageKey** – Storage key (default: `"theme"`).
- **storageType** – `"localStorage"` | `"cookie"` (default: `"localStorage"`).
- **cookieExpireDays** – Cookie expiry in days when using cookie (default:
  `365`).
- **disableTransition** – Disable transition during switch (default: `false`).
- **transitionDuration** – Transition duration in ms (default: `200`).
- **transitionCSS** – Custom CSS string injected during switch (optional).
- **persistTransitionCSS** – Keep transition CSS in the document after switch
  (default: `false`).

#### Events

- **THEME_CHANGE_EVENT** (`"theme:change"`) – CustomEvent with `detail`:
  `{ theme, mode, previousTheme, previousMode }`.

#### Types (exported)

- **ThemeMode**, **DarkModeStrategy**, **ThemeOptions**, **ThemeInstance**,
  **ThemeChangeEventDetail**.

#### Behaviour and behaviour details

- System preference listener: in `system` mode, theme updates when
  `prefers-color-scheme` changes.
- DOM element caching: root element is cached to avoid repeated queries.
- Optional transition: custom `transitionCSS` can be applied temporarily during
  switch or persisted in the page.
- Global singleton: **getTheme()** returns or creates a single global instance
  for convenience.

### Compatibility

- Deno 2.6+
- Bun 1.3.5+
- Browsers (primary target)
