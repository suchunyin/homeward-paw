import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { knowledgeApi } from "../api";
import { useAuthStore } from "../stores/authStore";

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
        <h1 className="text-[24px]">知识文章管理</h1>
        <button
          onClick={() => navigate("/admin/knowledge/new")}
          className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706]"
        >
          写文章
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none bg-white"
        >
          <option value="">全部分类</option>
          {Object.entries(CATEGORY_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none bg-white"
        >
          <option value="">全部状态</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
        <input
          className="flex-1 min-w-[200px] px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none focus:border-[#f59e0b]"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索标题/摘要..."
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 border border-[#e7e5e4] bg-white rounded-[8px] text-[14px] cursor-pointer hover:bg-[#fafaf9]"
        >
          搜索
        </button>
      </div>

      {loading ? (
        <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>
      ) : (
        <>
          <div className="overflow-x-auto bg-white rounded-[12px] border border-[#e7e5e4]">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-[#fafaf9] text-left">
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">标题</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">分类</th>
                  {isAdmin && <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">作者</th>}
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">状态</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">阅读</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">更新时间</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">操作</th>
                </tr>
              </thead>
              <tbody>
                {articles.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-10 text-[#78716c]">暂无文章</td></tr>
                ) : (
                  articles.map((a) => (
                    <tr key={a.id} className="border-b border-[#f5f5f4] last:border-b-0 hover:bg-[#fafaf9]">
                      <td className="px-4 py-2.5 font-medium">{a.title}</td>
                      <td className="px-4 py-2.5">{CATEGORY_MAP[a.category] || a.category}</td>
                      {isAdmin && <td className="px-4 py-2.5">{a.author_name}</td>}
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] ${
                            a.is_published ? "bg-[#dcfce7] text-[#166534]" : "bg-[#f1f5f9] text-[#64748b]"
                          }`}
                        >
                          {a.is_published ? "已发布" : "草稿"}
                        </span>
                      </td>
                      <td className="px-4 py-2.5">{a.view_count}</td>
                      <td className="px-4 py-2.5">{new Date(a.updated_at).toLocaleDateString("zh-CN")}</td>
                      <td className="px-4 py-2.5">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigate(`/admin/knowledge/${a.id}/edit`)}
                            className="px-2.5 py-1 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fafaf9]"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleTogglePublish(a.id)}
                            className={`px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer ${
                              a.is_published
                                ? "bg-[#f59e0b] text-white hover:bg-[#d97706]"
                                : "bg-[#16a34a] text-white hover:bg-[#15803d]"
                            }`}
                          >
                            {a.is_published ? "撤回" : "发布"}
                          </button>
                          <button
                            onClick={() => handleDelete(a.id, a.title)}
                            className="px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer bg-[#ef4444] text-white hover:bg-[#dc2626]"
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-[14px] text-[#78716c]">第 {page}/{totalPages} 页（共 {total} 条）</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
