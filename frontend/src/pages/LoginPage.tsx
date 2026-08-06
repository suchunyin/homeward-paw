import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";
import { useAuthStore } from "../stores/authStore";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await userApi.login({ account, password });
      const { access_token, user } = res.data;
      if (!access_token || !user) {
        setError("登录响应数据异常");
        return;
      }
      setAuth(access_token, user);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || "登录失败，请检查网络连接");
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
        <h2 className="text-center mb-6 text-[24px]">登录</h2>
        {error && <p className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">{error}</p>}
        <label className="block mb-4 text-[14px] text-[#78716c]">
          用户名 / 邮箱
          <input
            placeholder="输入用户名或邮箱"
            value={account}
            onChange={(e) => setAccount(e.target.value)}
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
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "登录中..." : "登录"}
        </button>
        <p className="text-center mt-4 text-[14px] text-[#78716c]">
          还没有账号？<Link to="/register" className="text-[#d97706] no-underline">去注册</Link>
        </p>
      </form>
    </div>
  );
}
