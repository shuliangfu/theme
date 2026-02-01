/**
 * 主题库测试
 *
 * 测试主题切换功能
 */

import { afterEach, describe, expect, it } from "@dreamer/test";
import {
  createTheme,
  destroyTheme,
  getAppliedTheme,
  getTheme,
  getThemeMode,
  setThemeMode,
  Theme,
  THEME_CHANGE_EVENT,
  toggleTheme,
} from "../src/mod.ts";

describe("Theme 主题库", () => {
  // 每个测试后清理
  afterEach(() => {
    destroyTheme();
  });

  describe("Theme 类", () => {
    it("应该使用默认配置创建实例", () => {
      const theme = new Theme();

      expect(theme.getMode()).toBe("system");
      expect(theme.getAppliedTheme()).toBeDefined();
      theme.destroy();
    });

    it("应该使用自定义配置创建实例", () => {
      const theme = new Theme({
        defaultMode: "dark",
        strategy: "attribute",
        attribute: "data-mode",
      });

      expect(theme.getMode()).toBe("dark");
      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });

    it("应该正确切换主题", () => {
      const theme = new Theme({ defaultMode: "light" });

      expect(theme.getAppliedTheme()).toBe("light");

      const newTheme = theme.toggle();
      expect(newTheme).toBe("dark");
      expect(theme.getAppliedTheme()).toBe("dark");

      const anotherTheme = theme.toggle();
      expect(anotherTheme).toBe("light");
      expect(theme.getAppliedTheme()).toBe("light");

      theme.destroy();
    });

    it("应该正确设置主题模式", () => {
      const theme = new Theme({ defaultMode: "light" });

      theme.setMode("dark");
      expect(theme.getMode()).toBe("dark");
      expect(theme.getAppliedTheme()).toBe("dark");

      theme.setMode("light");
      expect(theme.getMode()).toBe("light");
      expect(theme.getAppliedTheme()).toBe("light");

      theme.setMode("system");
      expect(theme.getMode()).toBe("system");
      // system 模式下，appliedTheme 取决于系统偏好

      theme.destroy();
    });

    it("应该支持变化回调", () => {
      const theme = new Theme({ defaultMode: "light" });
      const changes: Array<{ theme: string; mode: string }> = [];

      const unsubscribe = theme.onChange((appliedTheme, mode) => {
        changes.push({ theme: appliedTheme, mode });
      });

      theme.setMode("dark");
      theme.setMode("light");

      expect(changes.length).toBe(2);
      expect(changes[0].theme).toBe("dark");
      expect(changes[1].theme).toBe("light");

      // 取消订阅后不应该再收到通知
      unsubscribe();
      theme.setMode("dark");
      expect(changes.length).toBe(2);

      theme.destroy();
    });

    it("应该正确获取系统偏好", () => {
      const theme = new Theme();
      const preference = theme.getSystemPreference();

      expect(preference === "light" || preference === "dark").toBe(true);
      theme.destroy();
    });
  });

  describe("createTheme 函数", () => {
    it("应该创建新的主题实例", () => {
      const theme1 = createTheme({ defaultMode: "light" });
      const theme2 = createTheme({ defaultMode: "dark" });

      expect(theme1).not.toBe(theme2);
      expect(theme1.getMode()).toBe("light");
      expect(theme2.getMode()).toBe("dark");

      theme1.destroy();
      theme2.destroy();
    });
  });

  describe("getTheme 函数", () => {
    it("应该返回全局单例", () => {
      const theme1 = getTheme({ defaultMode: "light" });
      const theme2 = getTheme({ defaultMode: "dark" });

      expect(theme1).toBe(theme2);
      // 第二次调用的配置应该被忽略
      expect(theme1.getMode()).toBe("light");
    });
  });

  describe("策略配置", () => {
    it("class 策略应该是默认策略", () => {
      const theme = new Theme();
      // 默认使用 class 策略，darkClass 为 "dark"
      expect(theme.getMode()).toBeDefined();
      theme.destroy();
    });

    it("attribute 策略应该正常工作", () => {
      const theme = new Theme({
        strategy: "attribute",
        attribute: "data-theme",
        defaultMode: "dark",
      });

      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });
  });

  describe("存储配置", () => {
    it("localStorage 应该是默认存储", () => {
      const theme = new Theme({
        storageKey: "test-theme",
        defaultMode: "light",
      });

      // 在非浏览器环境，localStorage 可能不可用
      expect(theme.getMode()).toBe("light");
      theme.destroy();
    });

    it("cookie 存储应该正常配置", () => {
      const theme = new Theme({
        storageType: "cookie",
        storageKey: "theme-cookie",
        cookieExpireDays: 30,
        defaultMode: "dark",
      });

      expect(theme.getMode()).toBe("dark");
      theme.destroy();
    });
  });

  describe("事件派发", () => {
    it("应该派发主题变化事件", () => {
      const theme = new Theme({ defaultMode: "light" });
      let eventFired = false;
      let eventDetail: unknown = null;

      const handler = (e: Event) => {
        eventFired = true;
        eventDetail = (e as CustomEvent).detail;
      };

      globalThis.addEventListener(THEME_CHANGE_EVENT, handler);

      theme.setMode("dark");

      expect(eventFired).toBe(true);
      expect((eventDetail as { theme: string }).theme).toBe("dark");
      expect((eventDetail as { mode: string }).mode).toBe("dark");
      expect((eventDetail as { previousTheme: string }).previousTheme).toBe(
        "light",
      );

      globalThis.removeEventListener(THEME_CHANGE_EVENT, handler);
      theme.destroy();
    });
  });

  describe("destroy 方法", () => {
    it("应该清理资源", () => {
      const theme = new Theme({ defaultMode: "light" });
      const changes: string[] = [];

      theme.onChange((appliedTheme) => {
        changes.push(appliedTheme);
      });

      theme.setMode("dark");
      expect(changes.length).toBe(1);

      theme.destroy();

      // destroy 后回调应该被清理
      // 注意：destroy 后不应该再调用 setMode
    });
  });

  describe("全局函数", () => {
    it("toggleTheme 应该切换主题", () => {
      // 先初始化全局实例
      getTheme({ defaultMode: "light" });

      const result = toggleTheme();
      expect(result === "light" || result === "dark").toBe(true);
    });

    it("setThemeMode 应该设置模式", () => {
      getTheme({ defaultMode: "light" });

      setThemeMode("dark");
      expect(getThemeMode()).toBe("dark");

      setThemeMode("light");
      expect(getThemeMode()).toBe("light");

      setThemeMode("system");
      expect(getThemeMode()).toBe("system");
    });

    it("getAppliedTheme 应该返回当前主题", () => {
      getTheme({ defaultMode: "dark" });

      const applied = getAppliedTheme();
      expect(applied === "light" || applied === "dark").toBe(true);
    });

    it("getThemeMode 应该返回当前模式", () => {
      getTheme({ defaultMode: "light" });

      expect(getThemeMode()).toBe("light");
    });

    it("destroyTheme 应该销毁全局实例", () => {
      // 创建全局实例
      getTheme({ defaultMode: "light" });
      destroyTheme();

      // 销毁后再次获取应该是新实例
      const theme2 = getTheme({ defaultMode: "dark" });
      expect(theme2.getMode()).toBe("dark");
    });
  });

  describe("配置选项", () => {
    it("darkClass 应该可自定义", () => {
      const theme = new Theme({
        darkClass: "dark-mode",
        defaultMode: "dark",
      });

      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });

    it("lightClass 应该可配置", () => {
      const theme = new Theme({
        lightClass: "light-mode",
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
    });

    it("selector 应该可配置", () => {
      const theme = new Theme({
        selector: "body",
        defaultMode: "dark",
      });

      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });

    it("disableTransition 应该可配置", () => {
      const theme = new Theme({
        disableTransition: true,
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
    });

    it("transitionDuration 应该可配置", () => {
      const theme = new Theme({
        transitionDuration: 500,
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
    });

    it("storageKey 应该可配置", () => {
      const theme = new Theme({
        storageKey: "custom-theme-key",
        defaultMode: "dark",
      });

      expect(theme.getMode()).toBe("dark");
      theme.destroy();
    });
  });

  describe("边界情况", () => {
    it("相同主题设置不应触发回调", () => {
      const theme = new Theme({ defaultMode: "light" });
      const changes: string[] = [];

      theme.onChange((appliedTheme) => {
        changes.push(appliedTheme);
      });

      // 设置相同的主题
      theme.setMode("light");
      expect(changes.length).toBe(0);

      // 设置不同的主题
      theme.setMode("dark");
      expect(changes.length).toBe(1);

      theme.destroy();
    });

    it("多个回调应该都被调用", () => {
      const theme = new Theme({ defaultMode: "light" });
      const changes1: string[] = [];
      const changes2: string[] = [];

      theme.onChange((appliedTheme) => {
        changes1.push(appliedTheme);
      });

      theme.onChange((appliedTheme) => {
        changes2.push(appliedTheme);
      });

      theme.setMode("dark");

      expect(changes1.length).toBe(1);
      expect(changes2.length).toBe(1);

      theme.destroy();
    });

    it("回调错误不应影响其他回调", () => {
      const theme = new Theme({ defaultMode: "light" });
      const changes: string[] = [];

      // 第一个回调会抛出错误
      theme.onChange(() => {
        throw new Error("Test error");
      });

      // 第二个回调应该仍然被调用
      theme.onChange((appliedTheme) => {
        changes.push(appliedTheme);
      });

      theme.setMode("dark");

      // 第二个回调应该仍然被执行
      expect(changes.length).toBe(1);

      theme.destroy();
    });

    it("空配置应该使用默认值", () => {
      const theme = new Theme({});

      expect(theme.getMode()).toBe("system");
      theme.destroy();
    });

    it("media 策略应该正常配置", () => {
      const theme = new Theme({
        strategy: "media",
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
    });
  });

  describe("自定义过渡 CSS", () => {
    it("transitionCSS 应该可配置", () => {
      const theme = new Theme({
        transitionCSS: `
          html {
            transition: background-color 0.3s ease;
          }
        `,
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
    });

    it("persistTransitionCSS 应该可配置", () => {
      const theme = new Theme({
        transitionCSS: `
          html {
            transition: all 0.5s ease;
          }
        `,
        persistTransitionCSS: true,
        defaultMode: "dark",
      });

      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });

    it("临时过渡 CSS 应该在切换后移除", () => {
      const theme = new Theme({
        transitionCSS: `
          html { transition: all 0.1s; }
        `,
        persistTransitionCSS: false,
        transitionDuration: 50,
        defaultMode: "light",
      });

      theme.setMode("dark");
      expect(theme.getAppliedTheme()).toBe("dark");

      theme.destroy();
    });

    it("持久化过渡 CSS 应该在销毁时移除", () => {
      const theme = new Theme({
        transitionCSS: `
          html { transition: all 0.3s; }
        `,
        persistTransitionCSS: true,
        defaultMode: "light",
      });

      expect(theme.getAppliedTheme()).toBe("light");
      theme.destroy();
      // destroy 后应该清理过渡 CSS
    });
  });

  describe("DOM 缓存", () => {
    it("应该正确缓存 DOM 元素", () => {
      const theme = new Theme({ defaultMode: "light" });

      // 多次切换主题，应该使用缓存的元素
      theme.setMode("dark");
      theme.setMode("light");
      theme.setMode("dark");

      expect(theme.getAppliedTheme()).toBe("dark");
      theme.destroy();
    });

    it("销毁后应该清理缓存", () => {
      const theme = new Theme({ defaultMode: "dark" });
      theme.destroy();
      // 销毁后缓存应该被清理
    });
  });
});
