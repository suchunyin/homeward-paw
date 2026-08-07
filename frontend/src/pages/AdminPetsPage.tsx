import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../stores/authStore";
import { petApi } from "../api/index";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

const SPECIES = ["狗", "猫", "其它"];
const STATUS_MAP: Record<string, string> = {
  available: "可领养",
  adopted: "已领养",
  disabled: "已暂停",
};
const STATUS_COLOR: Record<string, "success" | "secondary" | "destructive"> = {
  available: "success",
  adopted: "secondary",
  disabled: "destructive",
};

interface PetItem {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  status: string;
  owner_name: string;
  created_at: string;
}

export default function AdminPetsPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const [pets, setPets] = useState<PetItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [species, setSpecies] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (keyword) params.keyword = keyword;
      if (species) params.species = species;
      if (statusFilter) params.status = statusFilter;
      const res = await petApi.manageList(params);
      setPets(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [page]);

  const handleSearch = () => {
    setPage(1);
    fetchPets();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确定删除「${name}」吗？`)) return;
    try {
      await petApi.manageDelete(id);
      fetchPets();
    } catch {
      toast.error("删除失败");
    }
  };

  const handleToggleStatus = async (id: number, current: string) => {
    const next = current === "available" ? "disabled" : "available";
    try {
      await petApi.toggleStatus(id, next);
      fetchPets();
    } catch {
      toast.error("操作失败");
    }
  };

  const totalPages = Math.ceil(total / 20);

  if (!user || (user.role !== "admin" && user.role !== "shelter")) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">领养管理</h1>
        <Button onClick={() => navigate("/admin/pets/new")} className="bg-amber-500 hover:bg-amber-600 text-white">
          发布领养
        </Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={species} onValueChange={(v) => { setSpecies(v); setPage(1); }}>
          <SelectTrigger className="w-[110px] h-9 text-[14px]">
            <SelectValue placeholder="全部物种" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部物种</SelectItem>
            {SPECIES.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[120px] h-9 text-[14px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="available">可领养</SelectItem>
            <SelectItem value="adopted">已领养</SelectItem>
            <SelectItem value="disabled">已暂停</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="flex-1 min-w-[200px] h-9 text-[14px] bg-white"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索宠物名称..."
        />
        <Button onClick={handleSearch} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
          搜索
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>
      ) : (
        <>
          <div className="rounded-[12px] border border-[hsl(var(--border))] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>名称</TableHead>
                  <TableHead>物种</TableHead>
                  <TableHead>品种</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>状态</TableHead>
                  {user.role === "admin" && <TableHead>发布者</TableHead>}
                  <TableHead>发布时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={user.role === "admin" ? 9 : 8} className="text-center py-10 text-[#78716c]">
                      暂无领养信息
                    </TableCell>
                  </TableRow>
                ) : (
                  pets.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell>{p.species}</TableCell>
                      <TableCell>{p.breed || "-"}</TableCell>
                      <TableCell>{p.age > 0 ? `${p.age}岁` : "-"}</TableCell>
                      <TableCell>{p.gender === "male" ? "公" : p.gender === "female" ? "母" : "-"}</TableCell>
                      <TableCell>
                        <Badge variant={STATUS_COLOR[p.status] || "secondary"}>
                          {STATUS_MAP[p.status] || p.status}
                        </Badge>
                      </TableCell>
                      {user.role === "admin" && <TableCell>{p.owner_name}</TableCell>}
                      <TableCell>{new Date(p.created_at).toLocaleDateString("zh-CN")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/pets/${p.id}/edit`)}>
                            编辑
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleToggleStatus(p.id, p.status)}>
                            {p.status === "available" ? "暂停" : "恢复"}
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDelete(p.id, p.name)}>
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
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)} size="sm">
                上一页
              </Button>
              <span className="text-[14px] text-[#78716c]">
                第 {page}/{totalPages} 页（共 {total} 条）
              </span>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)} size="sm">
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
