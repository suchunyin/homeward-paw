import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activityApi } from "../api";

const STATUS_MAP: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  completed: "已结束",
  cancelled: "已取消",
};

const STATUS_COLOR: Record<string, string> = {
  upcoming: "#d97706",
  ongoing: "#16a34a",
  completed: "#64748b",
  cancelled: "#ef4444",
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    activityApi
      .list({ page, page_size: pageSize, status })
      .then((res) => {
        setActivities(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page, status]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="text-center pt-8 pb-6">
        <h1 className="text-[36px] text-[#292524] mb-2">志愿者活动</h1>
        <p className="text-[#78716c] mb-8">加入我们，用行动温暖每一个小生命</p>
        <div className="flex gap-3 max-w-[600px] mx-auto max-sm:flex-col justify-center">
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="px-3 py-3 border-2 border-[#e7e5e4] rounded-[12px] text-[15px] outline-none bg-white"
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>
      ) : activities.length === 0 ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">暂无活动</div>
      ) : (
        <div>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {activities.map((a) => (
              <div
                key={a.id}
                onClick={() => navigate(`/activities/${a.id}`)}
                className="bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] cursor-pointer block"
              >
                <div className="h-[160px] overflow-hidden bg-[#fef3c7]">
                  {a.cover_image ? (
                    <img src={a.cover_image} alt={a.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[48px]">🎪</div>
                  )}
                </div>
                <div className="p-4">
                  <span
                    style={{
                      fontSize: 12,
                      color: STATUS_COLOR[a.status] || "#d97706",
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_MAP[a.status] || a.status}
                  </span>
                  <h3 className="text-[17px] mb-1 mt-1">{a.title}</h3>
                  <p className="text-[13px] text-[#78716c] mb-1">📍 {a.location}</p>
                  <p className="text-[13px] text-[#78716c] mb-1">
                    📅 {new Date(a.start_time).toLocaleDateString()}
                  </p>
                  <p className="text-[12px] text-[#d97706]">
                    👥 {a.enrolled_count}/{a.max_participants} 人报名
                  </p>
                </div>
              </div>
            ))}
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
              <span className="text-[14px] text-[#78716c]">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
