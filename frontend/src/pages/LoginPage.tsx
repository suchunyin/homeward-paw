import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";

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
    <div className="flex justify-center pt-[60px] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-[400px]">
        <Card>
          <CardContent className="p-10 pt-8">
            <h2 className="text-center mb-6 text-[24px] font-semibold">登录</h2>

            {error && (
              <p className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
                {error}
              </p>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="account">用户名 / 邮箱</Label>
                <Input
                  id="account"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
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

            <Button
              type="submit"
              disabled={loading}
              className="w-full mt-6 bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {loading ? "登录中..." : "登录"}
            </Button>

            <p className="text-center mt-4 text-[14px] text-[#78716c]">
              还没有账号？<Link to="/register" className="!text-amber-500 hover:underline">去注册</Link>
            </p>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
