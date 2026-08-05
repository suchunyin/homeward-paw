import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await userApi.login({ username, password });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "登录失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>登录</h2>
        {error && <p className="error-msg">{error}</p>}
        <label>
          用户名
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label>
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "登录中..." : "登录"}
        </button>
        <p className="auth-link">
          还没有账号？<Link to="/register">立即注册</Link>
        </p>
      </form>
    </div>
  );
}
