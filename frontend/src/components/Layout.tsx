import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-inner">
          <Link to="/" className="logo">
            🐾 Homeward Paw
          </Link>
          <nav className="nav">
            <Link to="/knowledge">救助知识</Link>
            <Link to="/activities">志愿者活动</Link>
            <Link to="/donations">爱心捐赠</Link>
            {token ? (
              <>
                <Link to="/publish">发布领养</Link>
                <Link to="/cloud-pets">云养宠</Link>
                <Link to="/profile">{user?.username}</Link>
                <button onClick={handleLogout} className="btn-link">
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  注册
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
      <footer className="footer">
        <p>© 2026 Homeward Paw - 让每一个生命都有家可归</p>
      </footer>
    </div>
  );
}
