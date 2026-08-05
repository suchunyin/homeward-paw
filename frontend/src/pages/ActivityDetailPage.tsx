import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { activityApi } from "../api";

const STATUS_MAP: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  completed: "已结束",
  cancelled: "已取消",
};

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activity, setActivity] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [msg, setMsg] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    activityApi
      .detail(Number(id))
      .then((res) => {
        setActivity(res.data);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      await activityApi.enroll(Number(id), {
        activity_id: Number(id),
        note: "",
      });
      setEnrolled(true);
      setMsg("报名成功！");
      // 刷新活动信息
      const res = await activityApi.detail(Number(id));
      setActivity(res.data);
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "报名失败");
    }
  };

  const handleCheckin = async () => {
    try {
      await activityApi.checkin(Number(id));
      setMsg("签到成功！");
    } catch (err: any) {
      setMsg(err.response?.data?.detail || "签到失败");
    }
  };

  if (loading) return <div className="loading-text">加载中...</div>;
  if (!activity) return <div className="empty-text">活动不存在</div>;

  return (
    <div className="pet-detail-page">
      <Link to="/activities" style={{ color: "var(--text-muted)", fontSize: 14 }}>
        ← 返回活动列表
      </Link>

      <div className="pet-detail-hero" style={{ marginTop: 16, height: 300 }}>
        {activity.cover_image ? (
          <img src={activity.cover_image} alt={activity.title} />
        ) : (
          <div className="img-placeholder large">🎪</div>
        )}
      </div>

      <div className="pet-detail-info">
        <h1>{activity.title}</h1>

        <div className="pet-tags">
          <span>{STATUS_MAP[activity.status]}</span>
          <span>👥 {activity.enrolled_count}/{activity.max_participants}</span>
        </div>

        <div className="pet-section">
          <h3>📅 活动时间</h3>
          <p>
            {new Date(activity.start_time).toLocaleString()} ~{" "}
            {new Date(activity.end_time).toLocaleString()}
          </p>
        </div>

        <div className="pet-section">
          <h3>📍 活动地点</h3>
          <p>{activity.location}</p>
        </div>

        <div className="pet-section">
          <h3>📝 活动介绍</h3>
          <p style={{ lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{activity.description}</p>
        </div>

        {activity.status === "upcoming" && (
          <div className="adoption-form">
            <h3>我要报名</h3>
            {!enrolled && activity.enrolled_count < activity.max_participants && (
              <>
                <button className="btn btn-primary btn-block" onClick={handleEnroll}>
                  立即报名
                </button>
              </>
            )}
            {activity.enrolled_count >= activity.max_participants && (
              <p className="apply-msg">名额已满</p>
            )}
            {msg && <p className="apply-msg" style={{ color: enrolled ? "#16a34a" : "#ef4444" }}>{msg}</p>}
          </div>
        )}

        {activity.status === "ongoing" && (
          <div className="adoption-form">
            <h3>活动签到</h3>
            <button className="btn btn-primary btn-block" onClick={handleCheckin}>
              签到打卡
            </button>
            {msg && <p className="apply-msg">{msg}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
