import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../api";
import { useAuthStore } from "../stores/authStore";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { token, logout } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    userApi
      .getMe()
      .catch(() => {
        logout();
        navigate("/login", { replace: true });
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  if (!token) return null;

  const user = useAuthStore.getState().user;

  return (
    <div className="max-w-[700px] mx-auto">
      <h1 className="text-[24px] mb-6">个人中心</h1>
      {user && (
        <div className="bg-white rounded-[12px] border border-[#e7e5e4] p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-[#fef3c7] flex items-center justify-center overflow-hidden flex-shrink-0">
            {user.avatar ? (
              <img src={user.avatar} alt="头像" className="w-full h-full object-cover" />
            ) : (
              <div className="text-[36px] text-[#d97706]">
                {user.username.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <div className="profile-info">
            <h2 className="text-[20px] mb-1">{user.username}</h2>
            <p className="text-[14px] text-[#78716c] mb-1">邮箱：{user.email}</p>
            <p className="text-[14px] text-[#78716c] mb-1">手机：{user.phone || "未绑定"}</p>
            <p className="text-[14px] text-[#78716c]">角色：{user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
