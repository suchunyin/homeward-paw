import type { NavigateFunction } from "react-router-dom";

/** 存储 react-router 的 navigate 函数引用，供 axios 拦截器等组件外部代码使用 */
let _navigate: NavigateFunction | null = null;
let _currentPath = "/";

/** 在应用初始化时注入 navigate 函数 */
export function setNavigate(navigate: NavigateFunction) {
  _navigate = navigate;
}

/** 在路由变化时同步当前路径 */
export function setCurrentPath(path: string) {
  _currentPath = path;
}

/** 获取当前路由路径 */
export function getCurrentPath() {
  return _currentPath;
}

/**
 * 编程式导航 —— 替代 window.location.href
 * 仅在 _navigate 未注入时静默失败，不会 fallback 到 window.location
 */
export function navigateTo(path: string, options?: { replace?: boolean }) {
  _navigate?.(path, options);
}
