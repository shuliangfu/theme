/**
 * 主题核心实现
 *
 * 为 TailwindCSS 和 UnoCSS 提供暗黑模式切换功能
 *
 * @module
 */

import type {
  ThemeChangeEventDetail,
  ThemeInstance,
  ThemeMode,
  ThemeOptions,
} from "./types.ts";

/**
 * 主题变化事件名称
 */
export const THEME_CHANGE_EVENT = "theme:change";

/**
 * 全局主题实例存储
 */
let globalThemeInstance: Theme | null = null;

/**
 * 主题管理类
 *
 * 提供完整的暗黑模式管理功能，支持 TailwindCSS 和 UnoCSS
 */
export class Theme implements ThemeInstance {
  /** 配置选项 */
  private options: Required<ThemeOptions>;

  /** 当前模式 */
  private mode: ThemeMode;

  /** 当前应用的主题 */
  private appliedTheme: "light" | "dark";

  /** 变化回调列表 */
  private callbacks: Set<(theme: "light" | "dark", mode: ThemeMode) => void> =
    new Set();

  /** 系统偏好媒体查询 */
  private mediaQuery: MediaQueryList | null = null;

  /** 媒体查询变化处理器 */
  private mediaQueryHandler: ((e: MediaQueryListEvent) => void) | null = null;

  /**
   * 创建主题实例
   *
   * @param options - 配置选项
   */
  constructor(options: ThemeOptions = {}) {
    // 合并默认配置
    this.options = {
      defaultMode: options.defaultMode ?? "system",
      strategy: options.strategy ?? "class",
      darkClass: options.darkClass ?? "dark",
      lightClass: options.lightClass ?? "",
      attribute: options.attribute ?? "data-theme",
      selector: options.selector ?? "html",
      storageKey: options.storageKey ?? "theme",
      storageType: options.storageType ?? "localStorage",
      cookieExpireDays: options.cookieExpireDays ?? 365,
      disableTransition: options.disableTransition ?? false,
      transitionDuration: options.transitionDuration ?? 200,
    };

    // 初始化主题
    this.mode = this.loadMode();
    this.appliedTheme = this.resolveTheme(this.mode);

    // 在浏览器环境中应用主题
    if (typeof globalThis.document !== "undefined") {
      this.applyTheme(false);
      this.setupSystemPreferenceListener();
    }
  }

  /**
   * 获取当前主题模式
   */
  getMode(): ThemeMode {
    return this.mode;
  }

  /**
   * 获取实际应用的主题
   */
  getAppliedTheme(): "light" | "dark" {
    return this.appliedTheme;
  }

  /**
   * 设置主题模式
   *
   * @param mode - 主题模式
   */
  setMode(mode: ThemeMode): void {
    const previousTheme = this.appliedTheme;
    const previousMode = this.mode;

    this.mode = mode;
    this.appliedTheme = this.resolveTheme(mode);

    // 保存到存储
    this.saveMode(mode);

    // 应用主题
    if (typeof globalThis.document !== "undefined") {
      this.applyTheme(true);
    }

    // 触发回调和事件
    if (previousTheme !== this.appliedTheme || previousMode !== this.mode) {
      this.notifyChange(previousTheme, previousMode);
    }
  }

  /**
   * 切换主题（light <-> dark）
   */
  toggle(): "light" | "dark" {
    const newTheme = this.appliedTheme === "dark" ? "light" : "dark";
    this.setMode(newTheme);
    return newTheme;
  }

  /**
   * 监听主题变化
   *
   * @param callback - 回调函数
   * @returns 取消监听函数
   */
  onChange(
    callback: (theme: "light" | "dark", mode: ThemeMode) => void,
  ): () => void {
    this.callbacks.add(callback);
    return () => {
      this.callbacks.delete(callback);
    };
  }

  /**
   * 获取系统偏好主题
   */
  getSystemPreference(): "light" | "dark" {
    if (typeof globalThis.matchMedia !== "undefined") {
      return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  }

  /**
   * 销毁实例，清理事件监听
   */
  destroy(): void {
    // 移除系统偏好监听
    if (this.mediaQuery && this.mediaQueryHandler) {
      this.mediaQuery.removeEventListener("change", this.mediaQueryHandler);
      this.mediaQuery = null;
      this.mediaQueryHandler = null;
    }

    // 清理回调
    this.callbacks.clear();

    // 清理全局实例
    if (globalThemeInstance === this) {
      globalThemeInstance = null;
    }
  }

  /**
   * 从存储加载主题模式
   */
  private loadMode(): ThemeMode {
    if (typeof globalThis.document === "undefined") {
      return this.options.defaultMode;
    }

    let saved: string | null = null;

    if (this.options.storageType === "localStorage") {
      try {
        saved = globalThis.localStorage?.getItem(this.options.storageKey);
      } catch {
        // localStorage 不可用
      }
    } else {
      saved = this.getCookie(this.options.storageKey);
    }

    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }

    return this.options.defaultMode;
  }

  /**
   * 保存主题模式到存储
   *
   * @param mode - 主题模式
   */
  private saveMode(mode: ThemeMode): void {
    if (typeof globalThis.document === "undefined") {
      return;
    }

    if (this.options.storageType === "localStorage") {
      try {
        globalThis.localStorage?.setItem(this.options.storageKey, mode);
      } catch {
        // localStorage 不可用
      }
    } else {
      this.setCookie(
        this.options.storageKey,
        mode,
        this.options.cookieExpireDays,
      );
    }
  }

  /**
   * 解析实际应用的主题
   *
   * @param mode - 主题模式
   * @returns 实际主题
   */
  private resolveTheme(mode: ThemeMode): "light" | "dark" {
    if (mode === "system") {
      return this.getSystemPreference();
    }
    return mode;
  }

  /**
   * 应用主题到 DOM
   *
   * @param animate - 是否启用动画
   */
  private applyTheme(animate: boolean): void {
    const element = globalThis.document?.querySelector(this.options.selector);
    if (!element) return;

    // 禁用过渡动画（如果需要）
    if (animate && !this.options.disableTransition) {
      this.disableTransitionTemporarily(element as HTMLElement);
    }

    // 根据策略应用主题
    if (this.options.strategy === "class") {
      this.applyClassStrategy(element);
    } else if (this.options.strategy === "attribute") {
      this.applyAttributeStrategy(element);
    }
    // media 策略不需要手动应用，由 CSS 处理
  }

  /**
   * 应用 class 策略
   *
   * @param element - 目标元素
   */
  private applyClassStrategy(element: Element): void {
    const { darkClass, lightClass } = this.options;

    if (this.appliedTheme === "dark") {
      element.classList.add(darkClass);
      if (lightClass) {
        element.classList.remove(lightClass);
      }
    } else {
      element.classList.remove(darkClass);
      if (lightClass) {
        element.classList.add(lightClass);
      }
    }
  }

  /**
   * 应用 attribute 策略
   *
   * @param element - 目标元素
   */
  private applyAttributeStrategy(element: Element): void {
    element.setAttribute(this.options.attribute, this.appliedTheme);
  }

  /**
   * 临时禁用过渡动画
   *
   * @param element - 目标元素
   */
  private disableTransitionTemporarily(element: HTMLElement): void {
    // 添加无过渡样式
    const css = globalThis.document?.createElement("style");
    if (!css) return;

    css.textContent = `
      *, *::before, *::after {
        transition-duration: 0s !important;
      }
    `;
    globalThis.document?.head?.appendChild(css);

    // 延迟后移除
    setTimeout(() => {
      css.remove();
    }, this.options.transitionDuration);
  }

  /**
   * 设置系统偏好监听器
   */
  private setupSystemPreferenceListener(): void {
    if (typeof globalThis.matchMedia === "undefined") return;

    this.mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    this.mediaQueryHandler = (_e: MediaQueryListEvent) => {
      // 仅当模式为 system 时响应
      if (this.mode === "system") {
        const previousTheme = this.appliedTheme;
        this.appliedTheme = this.getSystemPreference();

        if (previousTheme !== this.appliedTheme) {
          this.applyTheme(true);
          this.notifyChange(previousTheme, this.mode);
        }
      }
    };

    this.mediaQuery.addEventListener("change", this.mediaQueryHandler);
  }

  /**
   * 通知主题变化
   *
   * @param previousTheme - 之前的主题
   * @param previousMode - 之前的模式
   */
  private notifyChange(
    previousTheme: "light" | "dark",
    previousMode: ThemeMode,
  ): void {
    // 触发回调
    for (const callback of this.callbacks) {
      try {
        callback(this.appliedTheme, this.mode);
      } catch (error) {
        console.error("[Theme] Callback error:", error);
      }
    }

    // 派发自定义事件
    if (typeof globalThis.CustomEvent !== "undefined") {
      const detail: ThemeChangeEventDetail = {
        theme: this.appliedTheme,
        mode: this.mode,
        previousTheme,
        previousMode,
      };
      globalThis.dispatchEvent(
        new CustomEvent(THEME_CHANGE_EVENT, { detail }),
      );
    }
  }

  /**
   * 获取 Cookie 值
   *
   * @param name - Cookie 名称
   * @returns Cookie 值
   */
  private getCookie(name: string): string | null {
    if (typeof globalThis.document === "undefined") return null;
    const match = globalThis.document.cookie.match(
      new RegExp("(^| )" + name + "=([^;]+)"),
    );
    return match ? match[2] : null;
  }

  /**
   * 设置 Cookie
   *
   * @param name - Cookie 名称
   * @param value - Cookie 值
   * @param days - 过期天数
   */
  private setCookie(name: string, value: string, days: number): void {
    if (typeof globalThis.document === "undefined") return;
    const maxAge = days * 24 * 60 * 60;
    globalThis.document.cookie = `${name}=${value};path=/;max-age=${maxAge};SameSite=Lax`;
  }
}

/**
 * 创建主题实例
 *
 * @param options - 配置选项
 * @returns 主题实例
 *
 * @example
 * ```typescript
 * import { createTheme } from "@dreamer/theme";
 *
 * // TailwindCSS class 模式（默认）
 * const theme = createTheme();
 *
 * // UnoCSS attribute 模式
 * const theme = createTheme({
 *   framework: "unocss",
 *   strategy: "attribute",
 * });
 *
 * // 切换主题
 * theme.toggle();
 *
 * // 设置为深色模式
 * theme.setMode("dark");
 *
 * // 跟随系统
 * theme.setMode("system");
 * ```
 */
export function createTheme(options: ThemeOptions = {}): Theme {
  return new Theme(options);
}

/**
 * 获取或创建全局主题实例
 *
 * @param options - 配置选项（仅在首次创建时使用）
 * @returns 主题实例
 */
export function getTheme(options?: ThemeOptions): Theme {
  if (!globalThemeInstance) {
    globalThemeInstance = new Theme(options);
  }
  return globalThemeInstance;
}

/**
 * 全局主题切换函数
 *
 * @returns 切换后的主题
 */
export function toggleTheme(): "light" | "dark" {
  return getTheme().toggle();
}

/**
 * 全局设置主题模式函数
 *
 * @param mode - 主题模式
 */
export function setThemeMode(mode: ThemeMode): void {
  getTheme().setMode(mode);
}

/**
 * 全局获取当前主题函数
 *
 * @returns 当前应用的主题
 */
export function getAppliedTheme(): "light" | "dark" {
  return getTheme().getAppliedTheme();
}

/**
 * 全局获取当前模式函数
 *
 * @returns 当前主题模式
 */
export function getThemeMode(): ThemeMode {
  return getTheme().getMode();
}

/**
 * 销毁全局主题实例
 */
export function destroyTheme(): void {
  if (globalThemeInstance) {
    globalThemeInstance.destroy();
    globalThemeInstance = null;
  }
}
