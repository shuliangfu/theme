/**
 * 浏览器测试打包入口：导出 Theme API，供 @dreamer/test 以 IIFE + globalName 注入页面；
 * testReady 供运行器判定 bundle 已就绪。
 */
export * from "../src/mod.ts";

const g = globalThis as unknown as Record<string, unknown>;
g.testReady = true;
