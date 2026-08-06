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
      .get(Number(id))
      .then((res) => setArticle(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  if (!article) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">文章不存在</div>;

  return (
    <div className="max-w-[800px] mx-auto">
      <Link to="/knowledge" className="text-[#78716c] text-[14px] no-underline">
        ← 返回知识库
      </Link>
      <div className="mt-4">
        <span
          className="bg-[#fef3c7] text-[#d97706] px-3.5 py-1 rounded-[20px] text-[13px] font-semibold"
        >
          {CATEGORY_MAP[article.category] || article.category}
        </span>
      </div>
      <h1 className="text-[28px] mt-4 mb-2">{article.title}</h1>
      <div className="text-[13px] text-[#78716c] mb-6">
        发布于 {new Date(article.created_at).toLocaleDateString()} · 👁 {article.view_count} 次阅读
      </div>
      <div
        className="article-content"
        style={{
          lineHeight: 2,
          fontSize: 16,
          wordBreak: "break-word",
        }}
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </div>
  );
}
