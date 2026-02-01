# @dreamer/theme

轻量级主题切换库，专为 TailwindCSS 和 UnoCSS 设计。

[![JSR](https://jsr.io/badges/@dreamer/theme)](https://jsr.io/@dreamer/theme)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)
[![Tests](https://img.shields.io/badge/tests-36%20passed-green)](TEST_REPORT.md)

---

## 🎯 功能

提供完整的暗黑模式切换功能，支持浅色/深色/跟随系统三种模式，兼容 TailwindCSS 和 UnoCSS 的 class 策略和 attribute 策略。

---

## 📦 安装

**Deno**

```bash
deno add jsr:@dreamer/theme
```

**npm**

```bash
npx jsr add @dreamer/theme
```

---

## 🌍 环境兼容性

| 环境 | 支持 | 说明 |
|------|------|------|
| Deno | ✅ | 完全支持 |
| Bun | ✅ | 完全支持 |
| Node.js | ✅ | 通过 JSR 兼容层 |
| 浏览器 | ✅ | 主要运行环境 |

---

## ✨ 特性

- **主题模式**
  - 浅色模式 (light)
  - 深色模式 (dark)
  - 跟随系统 (system)

- **切换策略**
  - class 策略（TailwindCSS/UnoCSS 默认）
  - attribute 策略（自定义属性）
  - media 策略（纯 CSS 媒体查询）

- **持久化存储**
  - localStorage（默认）
  - Cookie

- **事件系统**
  - 回调监听
  - CustomEvent 事件派发

- **其他特性**
  - 系统偏好自动跟随
  - 切换动画控制
  - 自定义过渡 CSS
  - DOM 查询缓存（性能优化）
  - 全局单例模式
  - 完整 TypeScript 类型

---

## 🎯 使用场景

- 需要暗黑模式切换的 Web 应用
- 使用 TailwindCSS 或 UnoCSS 的项目
- 需要跟随系统偏好的应用
- 需要持久化用户主题选择的应用

---

## 🚀 快速开始

### 基础用法

```typescript
import { createTheme } from "@dreamer/theme";

// 创建主题实例
const theme = createTheme();

// 切换主题
theme.toggle();

// 设置为深色模式
theme.setMode("dark");

// 跟随系统
theme.setMode("system");
```

### TailwindCSS 配置

**TailwindCSS v4**（无需额外配置）：
```typescript
// v4 默认支持 class 策略，直接使用即可
const theme = createTheme();
```

**TailwindCSS v3**（需要配置）：
```javascript
// tailwind.config.js
module.exports = {
  darkMode: "class", // v3 默认是 "media"，需要手动设置为 "class"
};
```

### UnoCSS 配置

**UnoCSS 默认使用 media 策略**，如需 class 策略需配置：

```typescript
// uno.config.ts
import { defineConfig, presetUno } from "unocss";

export default defineConfig({
  presets: [presetUno({ dark: "class" })], // 默认是 "media"
});
```

**如果使用默认 media 策略**，库配置应改为：
```typescript
const theme = createTheme({
  strategy: "media", // 匹配框架默认行为
});
```

### 策略对照表

| 框架 | 版本 | 默认策略 | 需要配置 |
|------|------|----------|----------|
| TailwindCSS | v4 | class | ❌ 无需配置 |
| TailwindCSS | v3 | media | ✅ 需设置 `darkMode: "class"` |
| UnoCSS | - | media | ✅ 需设置 `dark: "class"` |

> **提示**：如果框架使用 `media` 策略（跟随系统），库的 `strategy` 也应设为 `"media"`，此时库仅用于获取/存储用户偏好，实际主题由 CSS 媒体查询控制。

---

## 🎨 使用示例

### 使用 attribute 策略

```typescript
const theme = createTheme({
  strategy: "attribute",
  attribute: "data-theme",
});
```

### 使用 Cookie 存储

```typescript
const theme = createTheme({
  storageType: "cookie",
  cookieExpireDays: 30,
});
```

### 监听主题变化

```typescript
const unsubscribe = theme.onChange((appliedTheme, mode) => {
  console.log(`主题: ${appliedTheme}, 模式: ${mode}`);
});

// 取消监听
unsubscribe();
```

### 监听事件

```typescript
import { THEME_CHANGE_EVENT } from "@dreamer/theme";

globalThis.addEventListener(THEME_CHANGE_EVENT, (event) => {
  const { theme, mode } = event.detail;
  console.log(`主题切换为: ${theme}`);
});
```

### 自定义过渡动画

```typescript
// 临时过渡 CSS（切换时注入，切换完成后移除）
const theme = createTheme({
  transitionCSS: `
    html {
      transition: background-color 0.3s ease, color 0.3s ease;
    }
    .card, .button {
      transition: all 0.3s ease;
    }
  `,
  transitionDuration: 300, // 过渡持续时间
});

// 持久化过渡 CSS（始终保留在页面中）
const theme = createTheme({
  transitionCSS: `
    * {
      transition: background-color 0.2s, color 0.2s, border-color 0.2s;
    }
  `,
  persistTransitionCSS: true, // 始终保留
});
```

### 防止闪烁

在 `<head>` 中添加内联脚本：

```html
<script>
  (function() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored === "dark" || stored === "light"
      ? stored
      : (prefersDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", theme === "dark");
  })();
</script>
```

---

## 📚 API 文档

### createTheme(options?)

创建主题实例。

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| defaultMode | `"light" \| "dark" \| "system"` | `"system"` | 默认模式 |
| strategy | `"class" \| "attribute" \| "media"` | `"class"` | 切换策略 |
| darkClass | `string` | `"dark"` | 深色模式 class |
| lightClass | `string` | `""` | 浅色模式 class |
| attribute | `string` | `"data-theme"` | HTML 属性名 |
| selector | `string` | `"html"` | 应用主题的选择器 |
| storageKey | `string` | `"theme"` | 存储键名 |
| storageType | `"localStorage" \| "cookie"` | `"localStorage"` | 存储类型 |
| cookieExpireDays | `number` | `365` | Cookie 过期天数 |
| disableTransition | `boolean` | `false` | 禁用切换动画 |
| transitionDuration | `number` | `200` | 动画时长 (ms) |
| transitionCSS | `string` | `""` | 自定义过渡 CSS |
| persistTransitionCSS | `boolean` | `false` | 持久化过渡 CSS |

### ThemeInstance 方法

| 方法 | 返回值 | 说明 |
|------|--------|------|
| `getMode()` | `ThemeMode` | 获取当前模式 |
| `getAppliedTheme()` | `"light" \| "dark"` | 获取实际应用的主题 |
| `setMode(mode)` | `void` | 设置主题模式 |
| `toggle()` | `"light" \| "dark"` | 切换主题 |
| `onChange(callback)` | `() => void` | 监听变化，返回取消函数 |
| `getSystemPreference()` | `"light" \| "dark"` | 获取系统偏好 |
| `destroy()` | `void` | 销毁实例 |

### 全局函数

| 函数 | 说明 |
|------|------|
| `getTheme(options?)` | 获取或创建全局单例 |
| `toggleTheme()` | 切换主题 |
| `setThemeMode(mode)` | 设置模式 |
| `getAppliedTheme()` | 获取当前主题 |
| `getThemeMode()` | 获取当前模式 |
| `destroyTheme()` | 销毁全局实例 |

### 类型定义

```typescript
import type {
  ThemeMode,              // "light" | "dark" | "system"
  DarkModeStrategy,       // "class" | "attribute" | "media"
  ThemeOptions,           // 配置选项
  ThemeInstance,          // 主题实例接口
  ThemeChangeEventDetail, // 事件详情
} from "@dreamer/theme";
```

---

## 📊 测试报告

| 指标 | 数值 |
|------|------|
| 测试时间 | 2026-02-01 |
| 总测试数 | 36 |
| 通过 | 36 |
| 失败 | 0 |
| 通过率 | 100% |

详细测试报告请查看 [TEST_REPORT.md](TEST_REPORT.md)

---

## 📝 注意事项

1. **防止闪烁**：在 `<head>` 中添加内联脚本，确保主题在页面渲染前应用
2. **系统偏好**：`system` 模式会监听 `prefers-color-scheme` 变化
3. **存储优先级**：存储的主题优先于默认模式
4. **销毁清理**：使用 `destroy()` 方法清理事件监听器

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request。

---

## 📄 许可证

[MIT](LICENSE.md)

---

Made with ❤️ by Dreamer Team
