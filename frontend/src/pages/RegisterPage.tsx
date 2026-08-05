import { type FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("adopter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await userApi.register({ username, email, password, role });
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>注册</h2>
        {error && <p className="error-msg">{error}</p>}
        <label>
          用户名
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
          />
        </label>
        <label>
          邮箱
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
            minLength={6}
          />
        </label>
        <label>
          身份
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="adopter">领养者</option>
            <option value="shelter">救助站</option>
          </select>
        </label>
        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "注册中..." : "注册"}
        </button>
        <p className="auth-link">
          已有账号？<Link to="/login">去登录</Link>
        </p>
      </form>
    </div>
  );
}
