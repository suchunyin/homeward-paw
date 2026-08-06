import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";

export default function Layout() {
  const navigate = useNavigate();
  const { token, user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-[#e7e5e4] sticky top-0 z-[100]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between max-sm:px-4">
          <Link to="/" className="text-[20px] font-bold text-[#d97706] no-underline">
            🐾 归途爪印
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              to="/knowledge"
              className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
            >
              救助知识
            </Link>
            <Link
              to="/donations"
              className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
            >
              爱心捐赠
            </Link>
            <Link
              to="/activities"
              className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
            >
              志愿活动
            </Link>
            {token ? (
              <>
                {user?.role === "admin" && (
                  <Link
                    to="/admin"
                    className="no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                    style={{ color: "#ef4444", fontWeight: 600 }}
                  >
                    系统管理
                  </Link>
                )}
                {(user?.role === "admin" || user?.role === "shelter") && (
                  <>
                    <Link
                      to="/admin/knowledge"
                      className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                    >
                      文章管理
                    </Link>
                    <Link
                      to="/admin/activities"
                      className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                    >
                      活动管理
                    </Link>
                  </>
                )}
                <Link
                  to="/publish"
                  className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                >
                  发布领养
                </Link>
                <Link
                  to="/cloud-pets"
                  className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                >
                  云养宠
                </Link>
                <Link
                  to="/profile"
                  className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                >
                  {user?.username}
                </Link>
                <button
                  onClick={handleLogout}
                  className="bg-none border-none text-[#78716c] cursor-pointer text-[14px] hover:text-[#ef4444]"
                >
                  退出
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                >
                  登录
                </Link>
                <Link
                  to="/register"
                  className="text-[#292524] no-underline text-[14px] transition-colors duration-200 hover:text-[#f59e0b]"
                >
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-[1200px] w-full mx-auto p-6">
        <Outlet />
      </main>
      <footer className="text-center p-6 text-[#78716c] text-[13px] border-t border-[#e7e5e4]">
        <p>© 2024 Homeward Paw · 归途爪印</p>
      </footer>
    </div>
  );
}
