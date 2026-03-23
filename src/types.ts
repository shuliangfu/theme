/**
 * 主题类型定义
 *
 * @module
 */

/**
 * 主题模式
 * - light: 浅色模式
 * - dark: 深色模式
 * - system: 跟随系统偏好
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * 暗黑模式策略
 * - class: 使用 CSS class（如 .dark）
 * - attribute: 使用 HTML 属性（如 data-theme="dark"）
 * - media: 使用 CSS media query（prefers-color-scheme）
 */
export type DarkModeStrategy = "class" | "attribute" | "media";

/**
 * 主题配置选项
 */
export interface ThemeOptions {
  /**
   * 默认主题模式
   * @default "system"
   */
  defaultMode?: ThemeMode;

  /**
   * 暗黑模式策略
   * - class: 使用 CSS class（TailwindCSS/UnoCSS 默认）
   * - attribute: 使用 HTML 属性
   * - media: 使用 CSS media query（亮/暗仍由 CSS 决定，见 `mediaSyncAttribute`）
   * @default "class"
   */
  strategy?: DarkModeStrategy;

  /**
   * 仅在 strategy="media" 时生效：在 `selector` 根节点写入解析后的 `"light"` | `"dark"`，
   * 便于脚本读取（与 `prefers-color-scheme` 视觉一致）。
   * - 默认 `"data-applied-theme"`（仅当 strategy 为 `media` 时启用；显式传 `""` 可关闭）
   * - class / attribute 策略下不会写入该属性
   * @default （strategy 为 media 时为 `"data-applied-theme"`，否则 `""`）
   */
  mediaSyncAttribute?: string;

  /**
   * 暗黑模式 class 名称（strategy="class" 时使用）
   * @default "dark"
   */
  darkClass?: string;

  /**
   * 浅色模式 class 名称（可选，strategy="class" 时使用）
   * @default undefined
   */
  lightClass?: string;

  /**
   * HTML 属性名（strategy="attribute" 时使用）
   * @default "data-theme"
   */
  attribute?: string;

  /**
   * 应用到的 HTML 选择器
   * @default "html"
   */
  selector?: string;

  /**
   * 存储键名
   * @default "theme"
   */
  storageKey?: string;

  /**
   * 存储类型
   * @default "localStorage"
   */
  storageType?: "localStorage" | "cookie";

  /**
   * Cookie 过期天数（storageType="cookie" 时使用）
   * @default 365
   */
  cookieExpireDays?: number;

  /**
   * 是否禁用过渡动画（切换主题时）
   * @default false
   */
  disableTransition?: boolean;

  /**
   * 过渡动画持续时间（毫秒）
   * @default 200
   */
  transitionDuration?: number;

  /**
   * 自定义过渡动画 CSS
   * 在主题切换时注入，用于定义过渡效果
   *
   * @example
   * ```typescript
   * transitionCSS: `
   *   html {
   *     transition: background-color 0.3s ease, color 0.3s ease;
   *   }
   *   .theme-transition {
   *     transition: all 0.3s ease;
   *   }
   * `
   * ```
   */
  transitionCSS?: string;

  /**
   * 是否持久化过渡 CSS（切换完成后保留）
   * @default false
   */
  persistTransitionCSS?: boolean;
}

/**
 * 主题实例接口
 */
export interface ThemeInstance {
  /**
   * 获取当前主题模式
   */
  getMode(): ThemeMode;

  /**
   * 获取实际应用的主题（light 或 dark）
   */
  getAppliedTheme(): "light" | "dark";

  /**
   * 设置主题模式
   * @param mode - 主题模式
   */
  setMode(mode: ThemeMode): void;

  /**
   * 切换主题（light <-> dark）
   */
  toggle(): "light" | "dark";

  /**
   * 监听主题变化
   * @param callback - 回调函数
   * @returns 取消监听函数
   */
  onChange(
    callback: (theme: "light" | "dark", mode: ThemeMode) => void,
  ): () => void;

  /**
   * 获取系统偏好主题
   */
  getSystemPreference(): "light" | "dark";

  /**
   * 销毁实例，清理事件监听
   */
  destroy(): void;
}

/**
 * 主题变化事件详情
 */
export interface ThemeChangeEventDetail {
  /** 当前应用的主题 */
  theme: "light" | "dark";
  /** 主题模式 */
  mode: ThemeMode;
  /** 之前的主题 */
  previousTheme: "light" | "dark";
  /** 之前的模式 */
  previousMode: ThemeMode;
}
