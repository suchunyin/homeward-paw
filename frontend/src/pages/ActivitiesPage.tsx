import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
      <div className="hero" style={{ padding: "32px 0 24px" }}>
        <h1>志愿者活动</h1>
        <p>加入我们，用行动温暖每一个小生命</p>
        <div className="search-bar" style={{ justifyContent: "center" }}>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          >
            <option value="">全部状态</option>
            {Object.entries(STATUS_MAP).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-text">加载中...</div>
      ) : activities.length === 0 ? (
        <div className="empty-text">暂无活动</div>
      ) : (
        <div>
          <div className="pet-grid">
            {activities.map((a) => (
              <div
                key={a.id}
                className="pet-card"
                style={{ display: "block", cursor: "pointer" }}
                onClick={() => navigate(`/activities/${a.id}`)}
              >
                <div className="pet-card-img" style={{ height: 160, background: "#fef3c7" }}>
                  {a.cover_image ? (
                    <img src={a.cover_image} alt={a.title} />
                  ) : (
                    <div className="img-placeholder" style={{ fontSize: 48 }}>🎪</div>
                  )}
                </div>
                <div className="pet-card-info">
                  <span
                    style={{
                      fontSize: 12,
                      color: STATUS_COLOR[a.status] || "#d97706",
                      fontWeight: 600,
                    }}
                  >
                    {STATUS_MAP[a.status] || a.status}
                  </span>
                  <h3 style={{ margin: "4px 0" }}>{a.title}</h3>
                  <p className="pet-meta">📍 {a.location}</p>
                  <p className="pet-meta">
                    📅 {new Date(a.start_time).toLocaleDateString()}
                  </p>
                  <p className="pet-location">
                    👥 {a.enrolled_count}/{a.max_participants} 人报名
                  </p>
                </div>
              </div>
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
