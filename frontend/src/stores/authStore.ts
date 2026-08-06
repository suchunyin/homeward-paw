import { create } from "zustand";
import { persist } from "zustand/middleware";

/** 与后端 UserOut 对齐的用户信息 */
export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  phone?: string | null;
  avatar?: string | null;
  is_active?: boolean;
  created_at?: string;
}

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  /** 登录/注册成功后设置认证信息 */
  setAuth: (token: string, user: UserInfo) => void;
  /** 退出登录，清除所有认证状态 */
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setAuth: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: "homeward-paw-auth",          // localStorage key
      partialize: (state) => ({           // 仅持久化 token + user
        token: state.token,
        user: state.user,
      }),
    },
  ),
);
