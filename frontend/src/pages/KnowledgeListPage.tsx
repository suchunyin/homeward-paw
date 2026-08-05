import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { knowledgeApi } from "../api";

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
      <div className="hero" style={{ padding: "32px 0 24px" }}>
        <h1>救助知识</h1>
        <p>学习科学养宠知识，让每一个生命都被温柔以待</p>
        <div className="search-bar">
          <select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">全部分类</option>
            {Object.entries(CATEGORY_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            placeholder="搜索文章标题..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button className="btn btn-primary" onClick={handleSearch}>搜索</button>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">加载中...</div>
      ) : articles.length === 0 ? (
        <div className="empty-text">暂无文章</div>
      ) : (
        <div className="pet-grid-section">
          <div className="pet-grid">
            {articles.map((a) => (
              <Link to={`/knowledge/${a.id}`} key={a.id} className="pet-card">
                <div className="pet-card-img" style={{ height: 160, background: "#fef3c7" }}>
                  {a.cover_image ? (
                    <img src={a.cover_image} alt={a.title} />
                  ) : (
                    <div className="img-placeholder" style={{ fontSize: 48 }}>📖</div>
                  )}
                </div>
                <div className="pet-card-info">
                  <span style={{ fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                    {CATEGORY_MAP[a.category] || a.category}
                  </span>
                  <h3 style={{ margin: "4px 0" }}>{a.title}</h3>
                  <p className="pet-meta">{a.summary || "阅读全文 →"}</p>
                  <p className="pet-location">👁 {a.view_count} 次阅读</p>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
