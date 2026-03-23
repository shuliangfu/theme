/**
 * Theme 浏览器环境测试
 *
 * 覆盖依赖真实 document / cookie / DOM 的行为：Cookie 编码、media 策略 data-* 同步、
 * 临时无过渡 style 单节点复用。需在可运行 Playwright Chromium 的环境执行。
 *
 * 说明：@dreamer/test 默认以 file:// 打开页面，浏览器通常不写入 document.cookie；
 * 依赖 cookie 的用例会先导航到本文件启动的 http://127.0.0.1 静态页再断言。
 */

import {
  afterAll,
  beforeAll,
  cleanupAllBrowsers,
  describe,
  expect,
  it,
} from "@dreamer/test";
import {
  cwd,
  resolve,
  serve,
  type ServeHandle,
} from "@dreamer/runtime-adapter";

/** 与 crypto 等包对齐：放宽资源清理校验、启用 Chromium 打包入口 */
const browserConfig = {
  sanitizeOps: false,
  sanitizeResources: false,
  timeout: 60_000,
  browser: {
    enabled: true,
    browserSource: "test" as const,
    entryPoint: "./tests/browser-entry.ts",
    globalName: "ThemeLib",
    browserMode: false,
    moduleLoadTimeout: 45_000,
    headless: true,
    reuseBrowser: true,
  },
};

/** 为 cookie 测试提供 http origin 的本地服务 */
let cookieTestServer: ServeHandle | null = null;
let cookieTestPort = 0;

/**
 * 启动仅用于 cookie 断言的静态页服务（内联 IIFE 与 browser-entry 一致）
 */
async function startCookieHttpServer(): Promise<void> {
  const { esbuild } = await import("@dreamer/esbuild");
  const entryPoint = resolve(cwd(), "tests/browser-entry.ts");
  const result = await esbuild.build({
    entryPoints: [entryPoint],
    bundle: true,
    format: "iife",
    globalName: "ThemeLib",
    write: false,
    platform: "browser",
    target: ["chrome100", "firefox100", "safari15"],
  });
  const bundleCode = new TextDecoder().decode(result.outputFiles[0].contents);
  cookieTestServer = serve({ port: 0 }, () => {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Theme cookie test</title></head>
<body>
<script>
${bundleCode}
</script>
</body>
</html>`;
    return new Response(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  });
  await new Promise((r) => setTimeout(r, 100));
  cookieTestPort = cookieTestServer.port ?? 0;
}

/**
 * 关闭 cookie 测试用 HTTP 服务
 */
async function stopCookieHttpServer(): Promise<void> {
  if (cookieTestServer) {
    await cookieTestServer.shutdown();
    cookieTestServer = null;
  }
}

/**
 * 导航到 http 测试页并等待 ThemeLib 就绪（供 document.cookie 使用）
 */
async function gotoHttpThemeCookiePage(t: {
  browser?: {
    goto: (url: string) => Promise<unknown>;
    waitFor: (
      fn: () => boolean,
      options?: { timeout?: number },
    ) => Promise<void>;
  };
}): Promise<void> {
  const b = t.browser!;
  const base = `http://127.0.0.1:${cookieTestPort}`;
  await b.goto(`${base}/`);
  await b.waitFor(
    () =>
      typeof (globalThis as unknown as { ThemeLib?: unknown }).ThemeLib !==
        "undefined",
    { timeout: 30_000 },
  );
}

describe("Theme 浏览器测试", () => {
  beforeAll(async () => {
    await startCookieHttpServer();
  });

  afterAll(async () => {
    await cleanupAllBrowsers();
    await stopCookieHttpServer();
  });

  it("setCookie 应对值 encodeURIComponent，分号不会拆段", async (t) => {
    await gotoHttpThemeCookiePage(t!);
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: { Theme: new (o?: object) => unknown };
      }).ThemeLib;
      const key = `theme-enc-${Date.now()}`;
      const theme = new Lib.Theme({
        storageType: "cookie",
        storageKey: key,
        defaultMode: "light",
      });
      const priv = theme as unknown as {
        setCookie(n: string, v: string, d: number): void;
      };
      priv.setCookie(key, "a;b", 365);
      const raw = document.cookie
        .split("; ")
        .find((s) => s.startsWith(`${key}=`));
      const val = raw ? raw.slice(key.length + 1) : "";
      (theme as { destroy(): void }).destroy();
      return {
        hasRaw: raw !== undefined,
        val,
        expectEnc: encodeURIComponent("a;b"),
      };
    });
    expect(result.hasRaw).toBe(true);
    expect(result.val).toBe(result.expectEnc);
    expect(result.val).toContain("%3B");
  }, browserConfig);

  it("getCookie 应解码 encode 后的持久化 mode", async (t) => {
    await gotoHttpThemeCookiePage(t!);
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: {
          Theme: new (o?: object) => { getMode(): string; destroy(): void };
        };
      }).ThemeLib;
      const key = `theme-round-${Date.now()}`;
      document.cookie = `${key}=${
        encodeURIComponent("dark")
      };path=/;max-age=86400`;
      const theme = new Lib.Theme({
        storageType: "cookie",
        storageKey: key,
        defaultMode: "light",
      });
      const mode = theme.getMode();
      theme.destroy();
      return mode;
    });
    expect(result).toBe("dark");
  }, browserConfig);

  it("解码后非法 mode 应回退 defaultMode", async (t) => {
    await gotoHttpThemeCookiePage(t!);
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: {
          Theme: new (o?: object) => { getMode(): string; destroy(): void };
        };
      }).ThemeLib;
      const key = `theme-bad-${Date.now()}`;
      document.cookie = `${key}=${
        encodeURIComponent("not;mode")
      };path=/;max-age=86400`;
      const theme = new Lib.Theme({
        storageType: "cookie",
        storageKey: key,
        defaultMode: "light",
      });
      const mode = theme.getMode();
      theme.destroy();
      return mode;
    });
    expect(result).toBe("light");
  }, browserConfig);

  it("media 策略默认写入 data-applied-theme，destroy 时移除", async (t) => {
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: { Theme: new (o?: object) => { destroy(): void } };
      }).ThemeLib;
      const theme = new Lib.Theme({
        strategy: "media",
        defaultMode: "light",
      });
      const whileAlive = document.documentElement.getAttribute(
        "data-applied-theme",
      );
      theme.destroy();
      const afterDestroy = document.documentElement.hasAttribute(
        "data-applied-theme",
      );
      return { whileAlive, afterDestroy };
    });
    expect(result.whileAlive).toBe("light");
    expect(result.afterDestroy).toBe(false);
  }, browserConfig);

  it("mediaSyncAttribute 为空时不写入 data-applied-theme", async (t) => {
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: { Theme: new (o?: object) => { destroy(): void } };
      }).ThemeLib;
      const theme = new Lib.Theme({
        strategy: "media",
        mediaSyncAttribute: "",
        defaultMode: "dark",
      });
      const v = document.documentElement.getAttribute("data-applied-theme");
      theme.destroy();
      return v;
    });
    expect(result).toBeNull();
  }, browserConfig);

  it("可自定义 mediaSyncAttribute 名称", async (t) => {
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: { Theme: new (o?: object) => { destroy(): void } };
      }).ThemeLib;
      const theme = new Lib.Theme({
        strategy: "media",
        mediaSyncAttribute: "data-ui-color-scheme",
        defaultMode: "light",
      });
      const custom = document.documentElement.getAttribute(
        "data-ui-color-scheme",
      );
      const def = document.documentElement.getAttribute("data-applied-theme");
      theme.destroy();
      return { custom, def };
    });
    expect(result.custom).toBe("light");
    expect(result.def).toBeNull();
  }, browserConfig);

  it("class 策略不写入 data-applied-theme", async (t) => {
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: { Theme: new (o?: object) => { destroy(): void } };
      }).ThemeLib;
      const theme = new Lib.Theme({
        strategy: "class",
        defaultMode: "light",
      });
      const v = document.documentElement.getAttribute("data-applied-theme");
      theme.destroy();
      return v;
    });
    expect(result).toBeNull();
  }, browserConfig);

  it("快速连续切换时仅一个 style[data-theme-no-transition]", async (t) => {
    const result = await t!.browser!.evaluate(() => {
      const Lib = (globalThis as unknown as {
        ThemeLib: {
          Theme: new (o?: object) => {
            setMode(m: "light" | "dark" | "system"): void;
            destroy(): void;
          };
        };
      }).ThemeLib;
      const theme = new Lib.Theme({
        defaultMode: "light",
        transitionCSS: "",
        transitionDuration: 5000,
        disableTransition: false,
      });
      for (let i = 0; i < 10; i++) {
        theme.setMode(i % 2 === 0 ? "dark" : "light");
      }
      const nDuring = document.querySelectorAll(
        "style[data-theme-no-transition]",
      ).length;
      theme.destroy();
      const nAfter = document.querySelectorAll(
        "style[data-theme-no-transition]",
      ).length;
      return { nDuring, nAfter };
    });
    expect(result.nDuring).toBe(1);
    expect(result.nAfter).toBe(0);
  }, browserConfig);
});
