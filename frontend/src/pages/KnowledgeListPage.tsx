import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { knowledgeApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const CATEGORY_MAP: Record<string, string> = {
  care: "日常护理",
  medical: "医疗健康",
  law: "法规政策",
  story: "救助故事",
};

export default function KnowledgeListPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);
  const pageSize = 10;

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const res = await knowledgeApi.list({ page, page_size: pageSize, category, keyword });
      setArticles(res.data.items);
      setTotal(res.data.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, [page, category]);

  const handleSearch = () => {
    setPage(1);
    fetchArticles();
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="text-center pt-8 pb-6">
        <h1 className="text-[36px] text-[#292524] mb-2">宠物知识</h1>
        <p className="text-[#78716c] mb-8">学习科学养宠知识，让每一个生命都被温柔以待</p>
        <div className="flex gap-3 max-w-[600px] mx-auto max-sm:flex-col">
          <Select
            value={category}
            onValueChange={(v) => { setCategory(v); setPage(1); }}
          >
            <SelectTrigger className="h-[48px] min-w-[130px] w-auto">
              <SelectValue placeholder="全部分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部分类</SelectItem>
              {Object.entries(CATEGORY_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            placeholder="搜索文章标题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-0 h-[48px]"
          />
          <Button onClick={handleSearch} size="lg" className="bg-amber-500 hover:bg-amber-600 text-white h-[48px] px-8">
            搜索
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">暂无文章</div>
      ) : (
        <div className="py-6">
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {articles.map((a) => (
              <Link
                to={`/knowledge/${a.id}`}
                key={a.id}
                className="bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]"
              >
                <div className="h-[160px] overflow-hidden bg-[#fef3c7]">
                  {a.cover_image ? (
                    <img src={a.cover_image} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[48px]">📖</div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-[12px] text-[#d97706] font-semibold">
                    {CATEGORY_MAP[a.category] || a.category}
                  </span>
                  <h3 className="text-[17px] mb-1 mt-1 font-medium">{a.title}</h3>
                  <p className="text-[13px] text-[#78716c] mb-1">{a.summary || "阅读全文 →"}</p>
                  <p className="text-[12px] text-[#d97706]">👁 {a.view_count} 次阅读</p>
                </div>
              </Link>
            ))}
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
              <span className="text-[14px] text-[#78716c]">{page} / {totalPages}</span>
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
        </div>
      )}
    </div>
  );
}
