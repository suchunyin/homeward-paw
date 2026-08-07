import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Card, CardContent } from "../components/ui/card";

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

const ROLE_DOT_COLORS: Record<string, string> = {
  admin: "#ef4444",
  adopter: "#22c55e",
  shelter: "#3b82f6",
  volunteer: "#f59e0b",
};

const ROLE_BADGE_VARIANT: Record<string, "destructive" | "success" | "info" | "default" | "warning"> = {
  admin: "destructive",
  adopter: "success",
  shelter: "info",
  volunteer: "warning",
};

export default function AdminPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

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
  const [modal, setModal] = useState<{ user: UserItem; newRole: string } | null>(null);
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

  if (!user) return null;
  if (user.role !== "admin") return null;

  return (
    <div>
      <h1 className="text-[24px] mb-6 font-semibold">系统管理</h1>

      {message && (
        <div
          className={`px-4 py-2.5 rounded-[8px] mb-4 text-[14px] flex items-center justify-between ${
            message.type === "success" ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#ef4444]"
          }`}
        >
          <span>{message.text}</span>
          <Button variant="ghost" size="sm" onClick={() => setMessage(null)}>✕</Button>
        </div>
      )}

      {/* 角色卡片 */}
      <section className="mb-8">
        <h2 className="text-[18px] mb-1 font-semibold">角色权限</h2>
        <p className="text-[#78716c] text-[14px] mb-4">四种系统角色及其权限说明</p>
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]">
          {roles.map((r) => (
            <Card key={r.value}>
              <CardContent className="p-5 flex items-start gap-3">
                <span
                  className="w-3 h-3 rounded-full mt-1 shrink-0"
                  style={{ background: ROLE_DOT_COLORS[r.value] || "#9ca3af" }}
                />
                <div>
                  <div className="font-semibold text-[15px] mb-1">{r.label}</div>
                  <div className="text-[13px] text-[#78716c]">{r.description}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <Separator className="my-6" />

      {/* 用户列表表格 */}
      <section>
        <div className="flex items-center justify-between mb-4 gap-4">
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-9 text-[14px]">
              <SelectValue placeholder="全部角色" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部角色</SelectItem>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[13px] text-[#78716c]">共 {total} 个用户</span>
        </div>

        <div className="rounded-[12px] border border-[hsl(var(--border))] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>用户名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>手机</TableHead>
                <TableHead>角色</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-[#78716c]">
                    {loading ? "加载中..." : "暂无用户数据"}
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>{u.id}</TableCell>
                    <TableCell className="font-medium">{u.username}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell>{u.phone}</TableCell>
                    <TableCell>
                      <Badge variant={ROLE_BADGE_VARIANT[u.role] || "secondary"}>
                        {roles.find((r) => r.value === u.role)?.label || u.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={u.is_active ? "text-[#16a34a]" : "text-[#ef4444]"}>
                        {u.is_active ? "正常" : "停用"}
                      </span>
                    </TableCell>
                    <TableCell className="text-[#78716c]">
                      {new Date(u.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModal({ user: u, newRole: u.role })}
                        >
                          改角色
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteTarget(u)}
                        >
                          删除
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex gap-2 mt-4 justify-center items-center">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              上一页
            </Button>
            <span className="text-[14px] text-[#78716c]">
              {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              下一页
            </Button>
          </div>
        )}
      </section>

      {/* 修改角色弹窗 */}
      <Dialog open={!!modal} onOpenChange={() => setModal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>修改角色</DialogTitle>
            <DialogDescription>
              为用户 <strong>{modal?.user.username}</strong> 设置新角色
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>新角色</Label>
              <Select value={modal?.newRole} onValueChange={(v) => modal && setModal({ ...modal, newRole: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal(null)}>取消</Button>
            <Button onClick={handleRoleChange}>确认修改</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除用户 <strong>{deleteTarget?.username}</strong> 吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>取消</Button>
            <Button variant="destructive" onClick={handleDelete}>确认删除</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
