# @dreamer/theme 测试报告

## 测试概览

| 项目     | 信息                                                                  |
| -------- | --------------------------------------------------------------------- |
| 包版本   | 1.1.0                                                                 |
| 测试框架 | @dreamer/test@^1.2.3                                                  |
| 测试时间 | 2026-07-23                                                            |
| 测试环境 | Deno 2.9+、Bun 1.3+、Node.js 22+（Linux/macOS/Windows）；浏览器用例使用 Chromium（Playwright） |

## 如何运行

| 命令                                  | 说明                                                       |
| ------------------------------------- | ---------------------------------------------------------- |
| `deno test -A tests/theme.test.ts`    | **单元测试**（CI，三端均使用此文件）                       |
| `deno task test:browser`              | 仅浏览器测试（`tests/browser/`，Playwright Chromium）      |
| `deno test -A tests/`                 | 完整套件（单元 + 浏览器），仅 Deno                         |
| `bun test tests/theme.test.ts`        | Bun 下单元测试                                             |
| `npm run test:node`                   | Node.js 下单元测试（`tsx --test --test-force-exit`）       |

> **CI 与本地**：CI 在 Deno/Bun/Node 三端运行 `tests/theme.test.ts`（单元）。
> 浏览器测试（`tests/browser/`）需 Chromium，通过 `deno task test:browser`
> 本地运行，不进入 CI。

## 测试结果

### 总体统计

| 运行时   | 测试总数 | 通过    | 失败 | 通过率 |
| -------- | -------- | ------- | ---- | ------ |
| **Deno** | 37       | 37 ✅   | 0    | 100%   |
| **Bun**  | 36       | 36 ✅   | 0    | 100%   |
| **Node** | 36       | 36 ✅   | 0    | 100%   |

- **执行时间**：约 7ms（Deno）、约 31ms（Bun）、约 163ms（Node）。
- Deno 多计 1 条：`@dreamer/test cleanup browsers` 生命周期步骤（浏览器清理钩子）。
  Bun/Node 仅计 36 条 `it()` 用例。

### 测试文件统计

| 测试文件                              | 测试数 | CI? | 状态 |
| ------------------------------------- | ------ | --- | ---- |
| `tests/theme.test.ts`                 | 36     | ✅  | ✅   |
| `tests/browser/theme-browser.test.ts` | 10     | ❌（本地） | ✅ |

浏览器文件中包含 **8** 条场景用例，以及 `@dreamer/test` 计为测试的
**套件生命周期**（如 `beforeAll` / `afterAll`），在 Deno 下合计 **10** 条。

## 功能测试详情

### 1. Theme 类 (`theme.test.ts`) - 6 个测试

| 测试场景                   | 状态 |
| -------------------------- | ---- |
| 应该使用默认配置创建实例   | ✅   |
| 应该使用自定义配置创建实例 | ✅   |
| 应该正确切换主题           | ✅   |
| 应该正确设置主题模式       | ✅   |
| 应该支持变化回调           | ✅   |
| 应该正确获取系统偏好       | ✅   |

### 2. createTheme 函数 (`theme.test.ts`) - 1 个测试

| 测试场景             | 状态 |
| -------------------- | ---- |
| 应该创建新的主题实例 | ✅   |

### 3. getTheme 函数 (`theme.test.ts`) - 1 个测试

| 测试场景         | 状态 |
| ---------------- | ---- |
| 应该返回全局单例 | ✅   |

### 4. 策略配置 (`theme.test.ts`) - 2 个测试

| 测试场景                   | 状态 |
| -------------------------- | ---- |
| class 策略应该是默认策略   | ✅   |
| attribute 策略应该正常工作 | ✅   |

### 5. 存储配置 (`theme.test.ts`) - 2 个测试

| 测试场景                    | 状态 |
| --------------------------- | ---- |
| localStorage 应该是默认存储 | ✅   |
| cookie 存储应该正常配置     | ✅   |

### 6. 事件派发 (`theme.test.ts`) - 1 个测试

| 测试场景             | 状态 |
| -------------------- | ---- |
| 应该派发主题变化事件 | ✅   |

### 7. destroy 方法 (`theme.test.ts`) - 1 个测试

| 测试场景     | 状态 |
| ------------ | ---- |
| 应该清理资源 | ✅   |

### 8. 全局函数 (`theme.test.ts`) - 5 个测试

| 测试场景                         | 状态 |
| -------------------------------- | ---- |
| toggleTheme 应该切换主题         | ✅   |
| setThemeMode 应该设置模式        | ✅   |
| getAppliedTheme 应该返回当前主题 | ✅   |
| getThemeMode 应该返回当前模式    | ✅   |
| destroyTheme 应该销毁全局实例    | ✅   |

### 9. 配置选项 (`theme.test.ts`) - 6 个测试

| 测试场景                      | 状态 |
| ----------------------------- | ---- |
| darkClass 应该可自定义        | ✅   |
| lightClass 应该可配置         | ✅   |
| selector 应该可配置           | ✅   |
| disableTransition 应该可配置  | ✅   |
| transitionDuration 应该可配置 | ✅   |
| storageKey 应该可配置         | ✅   |

### 10. 边界情况 (`theme.test.ts`) - 5 个测试

| 测试场景                 | 状态 |
| ------------------------ | ---- |
| 相同主题设置不应触发回调 | ✅   |
| 多个回调应该都被调用     | ✅   |
| 回调错误不应影响其他回调 | ✅   |
| 空配置应该使用默认值     | ✅   |
| media 策略应该正常配置   | ✅   |

### 11. 自定义过渡 CSS (`theme.test.ts`) - 4 个测试

| 测试场景                        | 状态 |
| ------------------------------- | ---- |
| transitionCSS 应该可配置        | ✅   |
| persistTransitionCSS 应该可配置 | ✅   |
| 临时过渡 CSS 应该在切换后移除   | ✅   |
| 持久化过渡 CSS 应该在销毁时移除 | ✅   |

### 12. DOM 缓存 (`theme.test.ts`) - 2 个测试

| 测试场景              | 状态 |
| --------------------- | ---- |
| 应该正确缓存 DOM 元素 | ✅   |
| 销毁后应该清理缓存    | ✅   |

### 13. 浏览器测试 (`tests/browser/theme-browser.test.ts`) - 8 个场景

在真实 Chromium 中执行；Cookie 相关用例通过本包内 **http://127.0.0.1**
静态服务提供可写 Cookie 的 origin（`file://` 下不可靠）。

| 测试场景                                                                 | 状态 |
| ------------------------------------------------------------------------ | ---- |
| setCookie 对值做 encodeURIComponent，分号等不拆段                        | ✅   |
| getCookie 解码持久化的 mode                                              | ✅   |
| 解码后非法 mode 回退 defaultMode                                         | ✅   |
| media 策略默认写入 `data-applied-theme`，destroy 时移除                  | ✅   |
| `mediaSyncAttribute: ""` 不写镜像属性                                    | ✅   |
| 自定义 `mediaSyncAttribute` 属性名                                       | ✅   |
| class 策略不写 `data-applied-theme`                                      | ✅   |
| 快速连续切换仅保留一个 `style[data-theme-no-transition]`，destroy 后清零 | ✅   |

## 测试覆盖分析（摘要）

| 范围                                  | 覆盖         |
| ------------------------------------- | ------------ |
| 三种策略（class / attribute / media） | ✅           |
| `mediaSyncAttribute`（media + DOM）   | ✅（浏览器） |
| localStorage / Cookie                 | ✅           |
| Cookie 编解码对称                     | ✅（浏览器） |
| 过渡与 `disableTransition`            | ✅           |
| DOM 缓存与 destroy 清理               | ✅           |

## 结论

在 Deno、Bun、Node.js 三端 **36** 条单元测试全部通过（Deno 计 37 条，含
`cleanup browsers` 生命周期钩子）。单元测试覆盖三端公开 API；浏览器测试（本地、
Playwright）覆盖真实 Cookie、`media` 策略下的 `data-*` 同步，以及无过渡
style 单节点复用。包仍聚焦于 TailwindCSS / UnoCSS 暗黑模式场景，API 与类型完整。

---

**English**：[docs/en-US/TEST_REPORT.md](../en-US/TEST_REPORT.md)
