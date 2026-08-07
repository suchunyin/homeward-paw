import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

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
    <div className="flex justify-center pt-[60px] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
        <Card>
          <CardContent className="p-10 pt-8">
            <h2 className="text-center mb-6 text-[24px] font-semibold">注册</h2>

            {error && (
              <p className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={2}
                  maxLength={32}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <p className="text-[12px] text-[#a8a29e] mt-4 mb-2 leading-relaxed">
              注册后身份默认为<strong className="text-[#78716c]">普通用户</strong>。如需升级为救助站、志愿者等角色，请联系管理员。
            </p>

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {loading ? "注册中..." : "注册"}
            </Button>

            <p className="text-center mt-4 text-[14px] text-[#78716c]">
              已有账号？<Link to="/login" className="!text-amber-500 hover:underline">去登录</Link>
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
