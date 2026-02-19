# 变更日志

@dreamer/theme 的所有重要变更均记录于此。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

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
