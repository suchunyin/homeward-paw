import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { knowledgeApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const CATEGORY_MAP: Record<string, string> = {
  care: "宠物护理",
  medical: "急救知识",
  law: "法规科普",
  story: "救助故事",
};

interface Article {
  id: number;
  title: string;
  category: string;
  summary: string;
  cover_image: string;
  author_id: number;
  author_name: string;
  is_published: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}

export default function AdminKnowledgePage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "shelter") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await knowledgeApi.manageList({
        page,
        page_size: 20,
        category: category || undefined,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      });
      setArticles(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, category, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchArticles();
  };

  const handleTogglePublish = async (id: number) => {
    try {
      await knowledgeApi.publishToggle(id);
      fetchArticles();
    } catch {
      alert("操作失败");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`确定删除文章「${title}」？`)) return;
    try {
      await knowledgeApi.delete(id);
      fetchArticles();
    } catch {
      alert("删除失败");
    }
  };

  const totalPages = Math.ceil(total / 20);

  if (!user || (user.role !== "admin" && user.role !== "shelter")) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">知识文章管理</h1>
        <Button onClick={() => navigate("/admin/knowledge/new")} className="bg-amber-500 hover:bg-amber-600 text-white">写文章</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1); }}>
          <SelectTrigger className="w-[130px] h-9 text-[14px]">
            <SelectValue placeholder="全部分类" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部分类</SelectItem>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[130px] h-9 text-[14px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="published">已发布</SelectItem>
            <SelectItem value="draft">草稿</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="flex-1 min-w-[200px] h-9 text-[14px] bg-white"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索标题/摘要..."
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
                  <TableHead>标题</TableHead>
                  <TableHead>分类</TableHead>
                  {isAdmin && <TableHead>作者</TableHead>}
                  <TableHead>状态</TableHead>
                  <TableHead>阅读</TableHead>
                  <TableHead>更新时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center py-10 text-[#78716c]">
                      暂无文章
                    </TableCell>
                  </TableRow>
                ) : (
                  articles.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{CATEGORY_MAP[a.category] || a.category}</TableCell>
                      {isAdmin && <TableCell>{a.author_name}</TableCell>}
                      <TableCell>
                        <Badge variant={a.is_published ? "success" : "secondary"}>
                          {a.is_published ? "已发布" : "草稿"}
                        </Badge>
                      </TableCell>
                      <TableCell>{a.view_count}</TableCell>
                      <TableCell>{new Date(a.updated_at).toLocaleDateString("zh-CN")}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/knowledge/${a.id}/edit`)}
                          >
                            编辑
                          </Button>
                          <Button
                            variant={a.is_published ? "default" : "secondary"}
                            size="sm"
                            onClick={() => handleTogglePublish(a.id)}
                          >
                            {a.is_published ? "撤回" : "发布"}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(a.id, a.title)}
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
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                size="sm"
              >
                上一页
              </Button>
              <span className="text-[14px] text-[#78716c]">
                第 {page}/{totalPages} 页（共 {total} 条）
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
