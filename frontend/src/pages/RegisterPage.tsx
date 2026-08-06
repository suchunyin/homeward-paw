import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";
import { useAuthStore } from "../stores/authStore";

export default function RegisterPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await userApi.register({ username, email, password });
      setAuth(res.data.access_token, res.data.user);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || "注册失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center pt-[60px]">
      <form
        className="w-full max-w-[400px] bg-white p-10 rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        onSubmit={handleSubmit}
      >
        <h2 className="text-center mb-6 text-[24px]">注册</h2>
        {error && <p className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">{error}</p>}
        <label className="block mb-4 text-[14px] text-[#78716c]">
          用户名
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength={2}
            maxLength={32}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          邮箱
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <p className="text-[12px] text-[#a8a29e] mb-4 leading-relaxed">
          注册后身份默认为<strong className="text-[#78716c]">普通用户</strong>。如需升级为救助站、志愿者等角色，请联系管理员。
        </p>
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "注册中..." : "注册"}
        </button>
        <p className="text-center mt-4 text-[14px] text-[#78716c]">
          已有账号？<Link to="/login" className="text-[#d97706] no-underline">去登录</Link>
        </p>
      </form>
    </div>
  );
}
