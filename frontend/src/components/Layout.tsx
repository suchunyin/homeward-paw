import { useState, useEffect, useRef, useCallback } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useAuthStore } from "../stores/authStore";
import { Button } from "./ui/button";

/* ─── 菜单项类型 ─── */
interface NavItem {
  to?: string;
  label: string;
  className?: string;
  requireRole?: string[];
  isButton?: boolean;
}

/* ─── 通用链接样式 ─── */
const LINK_BASE =
  "text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]";

export default function Layout() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  /* 退出登录 */
  const handleLogout = useCallback(() => {
    logout();
    navigate("/");
    setMenuOpen(false);
  }, [logout, navigate]);

  /* 关闭菜单 */
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  /* Escape 键关闭菜单 */
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  /* 点击菜单外部关闭 */
  useEffect(() => {
    if (!menuOpen) return;
    const onMouse = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        toggleRef.current &&
        !toggleRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouse);
    return () => document.removeEventListener("mousedown", onMouse);
  }, [menuOpen]);

  /* 菜单打开时锁定页面滚动 */
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  /* ─── 构建导航项 ─── */
  const commonItems: NavItem[] = [
    { to: "/", label: "首页" },
    { to: "/knowledge", label: "宠物知识" },
    { to: "/donations", label: "爱心捐赠" },
    { to: "/activities", label: "志愿活动" },
  ];

  const authedItems: NavItem[] = [
    {
      to: "/admin",
      label: "用户管理",
      className: "!text-[#ef4444] !font-semibold",
      requireRole: ["admin"],
    },
    {
      to: "/admin/knowledge",
      label: "文章管理",
      requireRole: ["admin", "shelter"],
    },
    {
      to: "/admin/activities",
      label: "活动管理",
      requireRole: ["admin", "shelter"],
    },
    {
      to: "/admin/pets",
      label: "领养管理",
      requireRole: ["admin", "shelter"],
    },
    {
      to: "/admin/adoptions",
      label: "申请审核",
      requireRole: ["admin", "shelter"],
    },
    { to: "/my-applications", label: "我的申请" },
    { to: "/cloud-pets", label: "云养宠" },
    { to: "/profile", label: user?.username || "个人中心" },
    { label: "退出", isButton: true },
  ];

  const guestItems: NavItem[] = [
    { to: "/login", label: "登录" },
    { to: "/register", label: "注册" },
  ];

  const allItems = token ? [...commonItems, ...authedItems] : [...commonItems, ...guestItems];

  /* 按角色过滤 */
  const filteredItems = allItems.filter((item) => {
    if (item.requireRole && (!user || !item.requireRole.includes(user.role))) return false;
    return true;
  });

  /* ─── 渲染单个导航链接 ─── */
  const renderLink = (item: NavItem, isMobile: boolean) => {
    if (item.isButton) {
      return isMobile ? (
        <Button
          key={item.label}
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-[#78716c] text-[15px] py-3.5 px-3 hover:text-[#ef4444] hover:bg-[#fafaf9]"
        >
          {item.label}
        </Button>
      ) : (
        <Button
          key={item.label}
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-[#78716c] hover:text-[#ef4444]"
        >
          {item.label}
        </Button>
      );
    }
    return (
      <Link
        key={item.to}
        to={item.to!}
        className={
          isMobile
            ? `block py-3.5 text-[15px] no-underline transition-colors duration-200 hover:text-[#f59e0b] hover:bg-[#fafaf9] rounded-[8px] px-3 ${
                item.className || LINK_BASE
              }`
            : item.className || LINK_BASE
        }
        onClick={isMobile ? closeMenu : undefined}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ─── 顶部导航栏 ─── */}
      <header className="bg-white border-b border-[#e7e5e4] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between max-sm:px-4">
          {/* Logo */}
          <Link
            to="/"
            className="text-[20px] font-bold text-[#d97706] no-underline shrink-0"
          >
            🐾 归途爪印
          </Link>

          {/* ─── 桌面端横向导航 ─── */}
          <nav
            className="hidden lg:flex items-center gap-4"
            role="navigation"
            aria-label="主导航"
          >
            {filteredItems.map((item) => renderLink(item, false))}
          </nav>

          {/* ─── 移动端汉堡按钮 ─── */}
          <button
            ref={toggleRef}
            type="button"
            className="lg:hidden relative flex flex-col items-center justify-center w-[42px] h-[42px] bg-transparent border-0 cursor-pointer rounded-[8px] hover:bg-[#f5f5f4] transition-colors -mr-1.5"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-haspopup="true"
            aria-label={menuOpen ? "关闭导航菜单" : "打开导航菜单"}
          >
            {/* 三条线 → X 形变动画 */}
            <span
              aria-hidden="true"
              className={`block w-[22px] h-[2px] bg-[#292524] rounded-full transition-all duration-300 origin-center ${
                menuOpen ? "rotate-45 translate-y-[5px]" : ""
              }`}
            />
            <span
              aria-hidden="true"
              className={`block w-[22px] h-[2px] bg-[#292524] rounded-full transition-all duration-300 mt-[5px] ${
                menuOpen ? "opacity-0 scale-x-0" : ""
              }`}
            />
            <span
              aria-hidden="true"
              className={`block w-[22px] h-[2px] bg-[#292524] rounded-full transition-all duration-300 mt-[5px] origin-center ${
                menuOpen ? "-rotate-45 -translate-y-[5px]" : ""
              }`}
            />
          </button>
        </div>

        {/* ─── 移动端垂直菜单面板 ─── */}
        <div
          id="mobile-menu"
          ref={menuRef}
          role="navigation"
          aria-label="移动端导航菜单"
          className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out bg-white ${
            menuOpen
              ? "max-h-[32rem] opacity-100 border-t border-[#e7e5e4] shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
              : "max-h-0 opacity-0 border-transparent"
          }`}
        >
          <nav className="flex flex-col py-2 px-6 max-sm:px-4">
            {filteredItems.map((item) => renderLink(item, true))}
          </nav>
        </div>
      </header>

      {/* ─── 主内容区 ─── */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6 max-sm:p-4">
        <Outlet />
      </main>

      {/* ─── Toast 通知容器 ─── */}
      <Toaster position="top-center" richColors />

      {/* ─── 页脚 ─── */}
      <footer className="text-center p-6 text-[#78716c] text-[13px] border-t border-[#e7e5e4]">
        <p>© 2024 Homeward Paw · 归途爪印</p>
      </footer>
    </div>
  );
}
