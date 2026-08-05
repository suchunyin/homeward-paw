import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adoptionApi } from "../api";

interface Adoption {
  id: number;
  pet_id: number;
  status: string;
  message: string;
  reply: string;
  created_at: string;
}

const STATUS_MAP: Record<string, string> = {
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
  cancelled: "已取消",
  completed: "已完成",
};

export default function ProfilePage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"my" | "received">("my");
  const [applications, setApplications] = useState<Adoption[]>([]);
  const [loading, setLoading] = useState(true);

  const userStr = localStorage.getItem("user");
  const user = userStr ? JSON.parse(userStr) : null;

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchData();
  }, [tab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = tab === "my"
        ? await adoptionApi.myApplications()
        : await adoptionApi.receivedApplications();
      setApplications(res.data);
    } catch (err) {
      console.error("加载失败", err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id: number, status: string) => {
    try {
      await adoptionApi.update(id, { status });
      fetchData();
    } catch (err) {
      console.error("操作失败", err);
    }
  };

  if (!user) return null;

  return (
    <div className="profile-page">
      <div className="profile-header">
        <div className="avatar-circle">🐾</div>
        <h2>{user.username}</h2>
        <p>{user.role === "shelter" ? "救助站" : "领养者"} · {user.email}</p>
      </div>

      <div className="tab-bar">
        <button className={tab === "my" ? "active" : ""} onClick={() => setTab("my")}>
          我的申请
        </button>
        {user.role === "shelter" && (
          <button className={tab === "received" ? "active" : ""} onClick={() => setTab("received")}>
            收到的申请
          </button>
        )}
      </div>

      {loading ? (
        <p className="loading-text">加载中...</p>
      ) : applications.length === 0 ? (
        <p className="empty-text">暂无记录</p>
      ) : (
        <div className="application-list">
          {applications.map((a) => (
            <div key={a.id} className="application-card">
              <div className="app-info">
                <p><strong>宠物ID:</strong> {a.pet_id}</p>
                <p><strong>留言:</strong> {a.message || "无"}</p>
                <p><strong>状态:</strong> <span className={`status-${a.status}`}>{STATUS_MAP[a.status]}</span></p>
                {a.reply && <p><strong>回复:</strong> {a.reply}</p>}
                <p className="app-time">{new Date(a.created_at).toLocaleDateString("zh-CN")}</p>
              </div>
              {tab === "received" && a.status === "pending" && (
                <div className="app-actions">
                  <button className="btn btn-primary btn-sm" onClick={() => handleReview(a.id, "approved")}>
                    通过
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleReview(a.id, "rejected")}>
                    拒绝
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
