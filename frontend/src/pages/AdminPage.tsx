import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api";
import { useAuthStore } from "../stores/authStore";

interface UserItem {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  created_at: string;
}

interface RoleInfo {
  value: string;
  label: string;
  description: string;
}

const ROLE_COLORS: Record<string, string> = {
  admin: "#ef4444",
  adopter: "#22c55e",
  shelter: "#3b82f6",
  volunteer: "#f59e0b",
};

const ROLE_DOT_COLORS: Record<string, string> = {
  admin: "#ef4444",
  adopter: "#22c55e",
  shelter: "#3b82f6",
  volunteer: "#f59e0b",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  // 权限守卫：非管理员重定向
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState("");
  const [roles, setRoles] = useState<RoleInfo[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [modal, setModal] = useState<{
    user: UserItem;
    newRole: string;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserItem | null>(null);
  const [loading, setLoading] = useState(false);
  const pageSize = 20;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await adminApi.listUsers({
        page,
        page_size: pageSize,
        ...(roleFilter ? { role: roleFilter } : {}),
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      // 401 由拦截器处理
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await adminApi.listRoles();
      setRoles(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.role === "admin") {
      fetchUsers();
      fetchRoles();
    }
  }, [page, roleFilter, user]);

  const handleRoleChange = async () => {
    if (!modal) return;
    try {
      await adminApi.updateUserRole(modal.user.id, modal.newRole);
      setMessage({ type: "success", text: `已将 ${modal.user.username} 的角色更新成功` });
      setModal(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.detail || "操作失败" });
      setModal(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await adminApi.deleteUser(deleteTarget.id);
      setMessage({ type: "success", text: `已删除用户 ${deleteTarget.username}` });
      setDeleteTarget(null);
      fetchUsers();
    } catch (err: any) {
      setMessage({ type: "error", text: err.response?.data?.detail || "操作失败" });
      setDeleteTarget(null);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  // 等待 user 加载完成
  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-[24px] mb-6">系统管理</h1>

      {message && (
        <div
          className={`px-4 py-2.5 rounded-[8px] mb-4 text-[14px] ${
            message.type === "success" ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#ef4444]"
          }`}
        >
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="float-right bg-none border-none cursor-pointer text-inherit"
          >
            ✕
          </button>
        </div>
      )}

      {/* 角色卡片 */}
      <section className="mb-8">
        <h2 className="text-[18px] mb-1">角色权限</h2>
        <p className="text-[#78716c] text-[14px] mb-4">四种系统角色及其权限说明</p>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {roles.map((r) => (
            <div
              key={r.value}
              className="bg-white rounded-[12px] border border-[#e7e5e4] p-5 flex items-start gap-3"
            >
              <span
                className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                style={{ background: ROLE_DOT_COLORS[r.value] || "#9ca3af" }}
              />
              <div>
                <div className="font-semibold text-[15px] mb-1">{r.label}</div>
                <div className="text-[13px] text-[#78716c]">{r.description}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 用户列表表格 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none bg-white"
          >
            <option value="">全部角色</option>
            {roles.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <span className="text-[13px] text-[#78716c]">共 {total} 个用户</span>
        </div>

        <div className="overflow-x-auto bg-white rounded-[12px] border border-[#e7e5e4]">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr className="bg-[#fafaf9] text-left">
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">ID</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">用户名</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">邮箱</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">手机</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">角色</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">状态</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">注册时间</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-[#78716c]">
                    {loading ? "加载中..." : "暂无用户数据"}
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-[#f5f5f4] last:border-b-0 hover:bg-[#fafaf9]">
                    <td className="px-4 py-2.5">{u.id}</td>
                    <td className="px-4 py-2.5 font-medium">{u.username}</td>
                    <td className="px-4 py-2.5">{u.email}</td>
                    <td className="px-4 py-2.5">{u.phone}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] border"
                        style={{
                          color: ROLE_COLORS[u.role] || "#6b7280",
                          borderColor: ROLE_COLORS[u.role] || "#6b7280",
                          background: (ROLE_COLORS[u.role] || "#6b7280") + "15",
                        }}
                      >
                        {roles.find((r) => r.value === u.role)?.label || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={u.is_active ? "text-[#16a34a]" : "text-[#ef4444]"}>
                        {u.is_active ? "正常" : "停用"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[#78716c]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setModal({ user: u, newRole: u.role })}
                          className="px-3 py-1.5 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fafaf9]"
                        >
                          改角色
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="px-3 py-1.5 border border-[#ef4444] bg-[#ef4444] text-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#dc2626]"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex gap-2 mt-4 justify-center items-center">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              上一页
            </button>
            <span className="text-[14px] leading-8">
              {page} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              下一页
            </button>
          </div>
        )}
      </section>

      {/* 修改角色弹窗 */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setModal(null)}
        >
          <div
            className="bg-white rounded-[12px] p-6 w-full max-w-[420px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] mb-4">修改角色</h3>
            <div className="mb-4">
              <p className="text-[14px] mb-3">
                用户：<strong>{modal.user.username}</strong>
              </p>
              <label className="block text-[14px] text-[#78716c]">
                新角色
                <select
                  value={modal.newRole}
                  onChange={(e) => setModal({ ...modal, newRole: e.target.value })}
                  className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none focus:border-[#f59e0b] bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setModal(null)}
                className="px-4 py-2 border border-[#e7e5e4] bg-white rounded-[8px] text-[14px] cursor-pointer hover:bg-[#fafaf9]"
              >
                取消
              </button>
              <button
                onClick={handleRoleChange}
                className="px-4 py-2 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer bg-[#f59e0b] text-white hover:bg-[#d97706]"
              >
                确认修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="bg-white rounded-[12px] p-6 w-full max-w-[420px] shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-[18px] mb-4">确认删除</h3>
            <div className="mb-4">
              <p className="text-[14px]">
                确定要删除用户 <strong>{deleteTarget.username}</strong> 吗？此操作不可撤销。
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 border border-[#e7e5e4] bg-white rounded-[8px] text-[14px] cursor-pointer hover:bg-[#fafaf9]"
              >
                取消
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer bg-[#ef4444] text-white hover:bg-[#dc2626]"
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
