/**
 * @dreamer/theme
 *
 * 轻量级主题切换库，专为 TailwindCSS 和 UnoCSS 设计
 *
 * 支持功能：
 * - 浅色/深色/系统偏好模式
 * - class 策略（默认，如 .dark）
 * - attribute 策略（如 data-theme="dark"）
 * - localStorage/Cookie 持久化
 * - 系统偏好自动跟随
 * - 主题变化事件监听
 *
 * @example
 * ```typescript
 * import { createTheme, toggleTheme, setThemeMode } from "@dreamer/theme";
 *
 * // 创建主题实例（class 策略，TailwindCSS/UnoCSS 默认）
 * const theme = createTheme();
 *
 * // 切换主题
 * theme.toggle();
 *
 * // 设置深色模式
 * theme.setMode("dark");
 *
 * // 跟随系统
 * theme.setMode("system");
 *
 * // 使用全局函数
 * toggleTheme();
 * setThemeMode("dark");
 * ```
 *
 * @module
 */

// 导出类型
export type {
  DarkModeStrategy,
  ThemeChangeEventDetail,
  ThemeInstance,
  ThemeMode,
  ThemeOptions,
} from "./types.ts";

// 导出核心类和函数
export {
  createTheme,
  destroyTheme,
  getAppliedTheme,
  getTheme,
  getThemeMode,
  setThemeMode,
  Theme,
  THEME_CHANGE_EVENT,
  toggleTheme,
} from "./theme.ts";
