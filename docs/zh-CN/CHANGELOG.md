# 变更日志

@dreamer/theme 的所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

---

## [1.1.0] - 2026-07-23

### 新增

- **Node.js 22+ 兼容**：全面支持三端运行时（Deno、Bun、Node.js）。单元测试
  在三端均通过（Deno 37 / Bun 36 / Node 36）。
- **CI**：9 作业矩阵（Deno/Bun/Node × Linux/macOS/Windows），每次向 `dev`
  分支 push/PR 时运行单元测试。浏览器（Playwright）测试保持本地运行
  （`deno task test:browser`），不进入 CI。
- **工具链**：新增 `tsconfig.json`、`package.json`（含 `test:node` 脚本
  `tsx --test --test-force-exit`、`engines.node >= 22`）、`.npmrc`
  （`@jsr:registry=https://npm.jsr.io`）与 `minimumDependencyAge`。

### 变更

- **`notifyChange` 事件派发守卫**（`src/theme.ts`）：CustomEvent 派发现在同时
  检查 `typeof globalThis.dispatchEvent === "function"`。Node 的 `globalThis`
  不是 `EventTarget`（与 Deno/Bun 不同），故在 Node 下全局事件派发被优雅跳过；
  `onChange` 回调照常触发。
- **测试环境**（`tests/theme.test.ts`）：新增 Node `EventTarget` polyfill，在
  `globalThis` 缺少 `addEventListener`/`removeEventListener`/`dispatchEvent`
  时补齐（Deno/Bun 已原生具备，polyfill 自跳过）。
- **`package.json` 运行时依赖**：移除未使用的 `@dreamer/esbuild` 与
  `@dreamer/runtime-adapter`。`src/` 零依赖（纯守卫的浏览器全局 API）；这两个包
  仅 Deno 浏览器测试使用，经 `deno.json` 的 `jsr:` import map 解析。这样
  `npm install`/`bun install` 更快，且避开 esbuild 二进制 postinstall。
- **依赖升级**：`@dreamer/runtime-adapter` ^1.2.2（`deno.json`）、
  `@dreamer/test` ^1.2.3。

### 兼容性

- Deno 2.9+
- Bun 1.3+
- Node.js 22+（自 v1.1.0 起）
- 浏览器（主要运行环境）

---

## [1.0.1] - 2026-03-24

### 新增

- **`mediaSyncAttribute`（`ThemeOptions`）** – 当 `strategy` 为 `"media"`
  时，可将解析后的应用主题（`"light"` | `"dark"`）同步到根节点（由 `selector`
  匹配）的 HTML 属性上，便于脚本读取或与 DevTools 对照。使用 media
  策略时默认属性名为 `data-applied-theme`；将 `mediaSyncAttribute` 设为 `""`
  可关闭。class / attribute 策略**不会**写入该镜像；非 media
  策略也**不会**随意删除页面上的同名属性，避免误清第三方 `data-*`。

### 变更

- **Cookie 持久化** – `setCookie` 对值使用 `encodeURIComponent`
  写入，`getCookie` 使用 `decodeURIComponent`
  读出，与写入对称，将来若存储内容含分号等字符也不会拆坏 cookie 段。当前合法
  mode 字符串仍为可读 ASCII；未编码的历史 cookie 在可能情况下仍可读取。

- **`prefers-color-scheme` 处理** – 在浏览器内尽早创建并复用同一
  `MediaQueryList`（`(prefers-color-scheme:
  dark)`），供初始解析、`getSystemPreference`
  与 `change` 监听共用，减少重复 `matchMedia`。

- **`onChange` / 事件派发** –
  遍历回调前复制订阅集合快照，避免回调内增删监听导致迭代异常。

- **临时关闭过渡** – 在未配置自定义
  `transitionCSS`、使用内置「临时禁用过渡」路径时，复用单个
  `<style data-theme-no-transition>` 插入
  `document.head`，极快连续切换时不再堆积多个节点；重复切换会清理上一次定时器。`destroy()`
  会移除该节点并清理定时器。

- **`destroy()` 清理** – 在 `strategy: "media"` 且配置了非空
  `mediaSyncAttribute` 时，销毁时移除本库写入的镜像属性；并执行上述无过渡 style
  的清理。

### 修复

- **Cookie 解析** – 按 `;` 分段并用前缀匹配读取，不再用 `storageKey`
  拼接正则，避免 storageKey 含正则元字符时误匹配。

### 文档与测试

- **测试** – `tests/theme.test.ts` 37
  条单元测试；`tests/browser/theme-browser.test.ts` 在真实 Chromium 下覆盖
  Cookie、`mediaSyncAttribute`、无过渡 style 复用等；Cookie 用例依赖本地
  `http://127.0.0.1` 静态页（`file://` 下 cookie
  不可靠）。完整套件：`deno test -A tests/`。

- **文档** – 更新中英文 TEST_REPORT 与 README（用例数量、运行方式、API 表中的
  `mediaSyncAttribute`）。

### 打包（Bun / npm 元数据）

- **`package.json`** – 版本与 `deno.json` 对齐；可选声明 `dependencies` /
  `devDependencies`，便于在 Bun
  侧运行相同测试（`@dreamer/runtime-adapter`、`@dreamer/esbuild`、`@dreamer/test`
  等，视 npm/JSR 桥接可用性而定）。

---

## [1.0.0] - 2026-02-20

### 新增

首个稳定版本。为 TailwindCSS 与 UnoCSS 提供轻量级客户端主题切换。

#### 主题模式

- **light**：强制浅色主题。
- **dark**：强制深色主题。
- **system**：跟随系统 `prefers-color-scheme`（默认）。

#### 切换策略

- **class**（默认）：在根元素上切换 CSS class（如 TailwindCSS/UnoCSS 的
  `dark`）。
- **attribute**：设置 HTML 属性（如 `data-theme="dark"`）。
- **media**：不修改 DOM，仅读取/存储偏好；实际主题由 CSS 媒体查询控制。

#### 存储

- **localStorage**（默认）：使用可配置的 key 持久化模式。
- **cookie**：可选的 Cookie 存储，支持可配置过期天数（`cookieExpireDays`）。

#### API

- **createTheme(options?)**：创建主题实例，可选传入配置。
- **Theme** 类：
  - **getMode()**：当前模式（light | dark | system）。
  - **getAppliedTheme()**：解析后的主题（light | dark）。
  - **setMode(mode)**：设置模式并持久化。
  - **toggle()**：在浅色与深色之间切换。
  - **onChange(callback)**：订阅主题变化，返回取消订阅函数。
  - **getSystemPreference()**：当前系统偏好（light | dark）。
  - **destroy()**：移除监听并清理资源。
- **全局方法**：**getTheme(options?)**、**toggleTheme()**、**setThemeMode(mode)**、**getAppliedTheme()**、**getThemeMode()**、**destroyTheme()**。

#### 配置项（ThemeOptions）

- **defaultMode**：默认主题模式（默认：`"system"`）。
- **strategy**：`"class"` | `"attribute"` | `"media"`（默认：`"class"`）。
- **darkClass**：深色模式 class 名（默认：`"dark"`）。
- **lightClass**：浅色模式 class 名（默认：`""`）。
- **attribute**：attribute 策略使用的属性名（默认：`"data-theme"`）。
- **selector**：应用主题的根元素选择器（默认：`"html"`）。
- **storageKey**：存储键名（默认：`"theme"`）。
- **storageType**：`"localStorage"` | `"cookie"`（默认：`"localStorage"`）。
- **cookieExpireDays**：使用 cookie 时的过期天数（默认：`365`）。
- **disableTransition**：切换时是否禁用过渡动画（默认：`false`）。
- **transitionDuration**：过渡时长（毫秒）（默认：`200`）。
- **transitionCSS**：切换时注入的自定义 CSS 字符串（可选）。
- **persistTransitionCSS**：切换完成后是否保留过渡 CSS（默认：`false`）。

#### 事件

- **THEME_CHANGE_EVENT**（`"theme:change"`）：CustomEvent，`detail` 包含
  `{ theme, mode, previousTheme, previousMode }`。

#### 类型导出

- **ThemeMode**、**DarkModeStrategy**、**ThemeOptions**、**ThemeInstance**、**ThemeChangeEventDetail**。

#### 行为与实现细节

- 系统偏好监听：在 `system` 模式下，当 `prefers-color-scheme`
  变化时自动更新主题。
- DOM 元素缓存：根元素被缓存，避免重复查询。
- 可选过渡：可通过 `transitionCSS` 在切换时临时注入或持久保留在页面中。
- 全局单例：**getTheme()** 返回或创建单一全局实例，便于在应用内复用。

### 兼容性

- Deno 2.6+
- Bun 1.3.5+
- 浏览器（主要运行环境）
