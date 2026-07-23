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

  /** DOM 元素缓存 - 避免重复查询 */
  private cachedElement: Element | null = null;

  /** 自定义过渡 CSS 样式元素 */
  private transitionStyleElement: HTMLStyleElement | null = null;

  /** 临时禁用全局过渡时复用的 style，避免快速连点堆积多个节点 */
  private noTransitionStyleElement: HTMLStyleElement | null = null;

  /** 与 noTransitionStyleElement 配套的清除定时器 */
  private noTransitionClearTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * 创建主题实例
   *
   * @param options - 配置选项
   */
  constructor(options: ThemeOptions = {}) {
    const strategy = options.strategy ?? "class";
    /** media 策略默认向根节点同步解析后的亮/暗；显式 `mediaSyncAttribute: ""` 可关闭 */
    const defaultMediaSync = strategy === "media" ? "data-applied-theme" : "";

    // 合并默认配置
    this.options = {
      defaultMode: options.defaultMode ?? "system",
      strategy,
      darkClass: options.darkClass ?? "dark",
      lightClass: options.lightClass ?? "",
      attribute: options.attribute ?? "data-theme",
      selector: options.selector ?? "html",
      storageKey: options.storageKey ?? "theme",
      storageType: options.storageType ?? "localStorage",
      cookieExpireDays: options.cookieExpireDays ?? 365,
      disableTransition: options.disableTransition ?? false,
      transitionDuration: options.transitionDuration ?? 200,
      transitionCSS: options.transitionCSS ?? "",
      persistTransitionCSS: options.persistTransitionCSS ?? false,
      mediaSyncAttribute: options.mediaSyncAttribute !== undefined
        ? options.mediaSyncAttribute
        : defaultMediaSync,
    };

    /**
     * 浏览器内提前创建 prefers-color-scheme 的 MediaQueryList，供 loadMode/resolveTheme
     * 与系统偏好监听共用，避免多次 matchMedia 与不一致的查询对象。
     */
    if (
      typeof globalThis.document !== "undefined" &&
      typeof globalThis.matchMedia !== "undefined"
    ) {
      this.mediaQuery = globalThis.matchMedia("(prefers-color-scheme: dark)");
    }

    // 初始化主题
    this.mode = this.loadMode();
    this.appliedTheme = this.resolveTheme(this.mode);

    // 在浏览器环境中应用主题
    if (typeof globalThis.document !== "undefined") {
      // 缓存 DOM 元素
      this.cacheElement();
      this.applyTheme(false);
      this.setupSystemPreferenceListener();

      // 如果配置了持久化过渡 CSS，则立即注入
      if (this.options.transitionCSS && this.options.persistTransitionCSS) {
        this.injectTransitionCSS();
      }
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
    if (this.mediaQuery) {
      return this.mediaQuery.matches ? "dark" : "light";
    }
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

    // 依赖缓存元素与 head 的副作用须在清缓存前处理
    this.clearNoTransitionStyle();
    this.removeMediaMirrorFromDom();

    // 清理 DOM 缓存
    this.cachedElement = null;

    // 移除过渡 CSS
    this.removeTransitionCSS();

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
   * 缓存 DOM 元素
   * 避免每次应用主题时重复查询 DOM
   */
  private cacheElement(): void {
    this.cachedElement = globalThis.document?.querySelector(
      this.options.selector,
    ) ?? null;
  }

  /**
   * 获取目标元素（优先使用缓存）
   *
   * @returns 目标元素或 null
   */
  private getElement(): Element | null {
    // 如果缓存存在且元素仍在 DOM 中，直接返回
    if (this.cachedElement && this.cachedElement.isConnected) {
      return this.cachedElement;
    }
    // 否则重新查询并缓存
    this.cacheElement();
    return this.cachedElement;
  }

  /**
   * 注入自定义过渡 CSS
   */
  private injectTransitionCSS(): void {
    if (!this.options.transitionCSS) return;
    if (typeof globalThis.document === "undefined") return;

    // 如果已存在，先移除
    this.removeTransitionCSS();

    // 创建并注入样式元素
    this.transitionStyleElement = globalThis.document.createElement("style");
    this.transitionStyleElement.setAttribute("data-theme-transition", "true");
    this.transitionStyleElement.textContent = this.options.transitionCSS;
    globalThis.document.head?.appendChild(this.transitionStyleElement);
  }

  /**
   * 移除自定义过渡 CSS
   */
  private removeTransitionCSS(): void {
    if (this.transitionStyleElement) {
      this.transitionStyleElement.remove();
      this.transitionStyleElement = null;
    }
  }

  /**
   * 应用主题到 DOM
   *
   * @param animate - 是否启用动画
   */
  private applyTheme(animate: boolean): void {
    const element = this.getElement();
    if (!element) return;

    // 处理过渡动画
    if (animate && !this.options.disableTransition) {
      if (this.options.transitionCSS && !this.options.persistTransitionCSS) {
        // 使用自定义过渡 CSS（临时注入）
        this.injectTransitionCSS();
        // 切换完成后移除
        setTimeout(() => {
          this.removeTransitionCSS();
        }, this.options.transitionDuration);
      } else if (!this.options.transitionCSS) {
        // 使用默认行为：临时禁用过渡
        this.disableTransitionTemporarily(element as HTMLElement);
      }
      // 如果 persistTransitionCSS 为 true，过渡 CSS 已在构造函数中注入，无需额外处理
    }

    // 根据策略应用主题
    if (this.options.strategy === "class") {
      this.applyClassStrategy(element);
    } else if (this.options.strategy === "attribute") {
      this.applyAttributeStrategy(element);
    }
    // media 策略：视觉由 CSS（prefers-color-scheme）处理；可选在根节点同步 data-* 供脚本读取
    this.syncMediaMirrorAttribute(element);
  }

  /**
   * media 策略下在根节点写入解析后的 light/dark；非 media 策略不写、不删，避免误清页面上的同名属性。
   *
   * @param element - selector 对应根节点
   */
  private syncMediaMirrorAttribute(element: Element): void {
    const key = this.options.mediaSyncAttribute;
    if (!key) return;
    if (this.options.strategy === "media") {
      element.setAttribute(key, this.appliedTheme);
    }
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
   * 临时禁用过渡动画（复用单个 style 节点，避免极快连续切换时 head 内堆积多个标签）
   * 注意：使用全局 CSS 禁用所有过渡；element 参数预留供未来扩展
   *
   * @param _element - 目标元素（当前未使用，预留参数）
   */
  private disableTransitionTemporarily(_element: HTMLElement): void {
    const doc = globalThis.document;
    if (!doc) return;

    // 新一轮切换：取消上一轮的清除定时器，避免旧定时器清空新注入的样式
    if (this.noTransitionClearTimer !== null) {
      clearTimeout(this.noTransitionClearTimer);
      this.noTransitionClearTimer = null;
    }

    if (!this.noTransitionStyleElement) {
      const el = doc.createElement("style");
      el.setAttribute("data-theme-no-transition", "true");
      doc.head?.appendChild(el);
      this.noTransitionStyleElement = el;
    }

    this.noTransitionStyleElement.textContent = `
      *, *::before, *::after {
        transition-duration: 0s !important;
      }
    `;

    this.noTransitionClearTimer = setTimeout(() => {
      if (this.noTransitionStyleElement) {
        this.noTransitionStyleElement.textContent = "";
      }
      this.noTransitionClearTimer = null;
    }, this.options.transitionDuration);
  }

  /**
   * 移除临时无过渡 style 并清理定时器（destroy 或完全重置时用）
   */
  private clearNoTransitionStyle(): void {
    if (this.noTransitionClearTimer !== null) {
      clearTimeout(this.noTransitionClearTimer);
      this.noTransitionClearTimer = null;
    }
    if (this.noTransitionStyleElement) {
      this.noTransitionStyleElement.remove();
      this.noTransitionStyleElement = null;
    }
  }

  /**
   * 销毁时移除 media 策略写入的根节点镜像属性（仅本策略且配置了属性名时）
   */
  private removeMediaMirrorFromDom(): void {
    const key = this.options.mediaSyncAttribute;
    if (!key || this.options.strategy !== "media") return;
    const el = this.getElement();
    if (el) el.removeAttribute(key);
  }

  /**
   * 设置系统偏好监听器
   */
  private setupSystemPreferenceListener(): void {
    if (!this.mediaQuery) return;

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
    // 快照避免回调内 onChange/unsubscribe 修改 Set 导致迭代异常
    const callbacks = [...this.callbacks];
    for (const callback of callbacks) {
      try {
        callback(this.appliedTheme, this.mode);
      } catch (error) {
        console.error("[Theme] Callback error:", error);
      }
    }

    // 派发自定义事件（仅当运行时提供全局事件目标时；Node 的 globalThis 非 EventTarget，跳过）
    if (
      typeof globalThis.CustomEvent !== "undefined" &&
      typeof globalThis.dispatchEvent === "function"
    ) {
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
   * 读取 Cookie：按 `; ` 分段解析（避免 storageKey 含特殊字符时误匹配），值做 decodeURIComponent（与 setCookie 对称）。
   *
   * @param name - Cookie 名称
   * @returns Cookie 值
   */
  private getCookie(name: string): string | null {
    if (typeof globalThis.document === "undefined") return null;
    const prefix = `${name}=`;
    for (const segment of globalThis.document.cookie.split("; ")) {
      if (!segment.startsWith(prefix)) continue;
      const raw = segment.slice(prefix.length);
      try {
        return decodeURIComponent(raw);
      } catch {
        return raw;
      }
    }
    return null;
  }

  /**
   * 设置 Cookie（值经 encodeURIComponent，与 getCookie 解码对称，避免将来值中含 `;` 等破坏分段）
   *
   * @param name - Cookie 名称
   * @param value - Cookie 值
   * @param days - 过期天数
   */
  private setCookie(name: string, value: string, days: number): void {
    if (typeof globalThis.document === "undefined") return;
    const maxAge = days * 24 * 60 * 60;
    const encoded = encodeURIComponent(value);
    globalThis.document.cookie =
      `${name}=${encoded};path=/;max-age=${maxAge};SameSite=Lax`;
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
