import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { knowledgeApi } from "../api";

const CATEGORY_MAP: Record<string, string> = {
  care: "日常护理",
  medical: "医疗健康",
  law: "法规政策",
  story: "救助故事",
};

export default function KnowledgeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    knowledgeApi
      .detail(Number(id))
      .then((res) => setArticle(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-text">加载中...</div>;
  if (!article) return <div className="empty-text">文章不存在</div>;

  return (
    <div className="pet-detail-page">
      <Link to="/knowledge" style={{ color: "var(--text-muted)", fontSize: 14 }}>
        ← 返回知识库
      </Link>
      <div style={{ marginTop: 16 }}>
        <span
          style={{
            background: "#fef3c7",
            color: "#d97706",
            padding: "4px 14px",
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {CATEGORY_MAP[article.category] || article.category}
        </span>
      </div>
      <h1 style={{ fontSize: 28, marginTop: 16, marginBottom: 8 }}>{article.title}</h1>
      <div className="pet-meta" style={{ marginBottom: 24 }}>
        发布于 {new Date(article.created_at).toLocaleDateString()} · 👁 {article.view_count} 次阅读
      </div>
      <div
        style={{
          lineHeight: 2,
          fontSize: 16,
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {article.content}
      </div>
    </div>
  );
}
