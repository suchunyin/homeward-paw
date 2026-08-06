import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";

const STATUS_MAP: Record<string, string> = {
  upcoming: "招募中",
  ongoing: "进行中",
  completed: "已结束",
};

interface Enrollment {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  is_checked_in: boolean;
  checked_in_at: string | null;
  note: string;
  created_at: string;
}

interface ActivityDetail {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  enrolled_count: number;
  status: string;
  organizer_id: number;
  created_at: string;
}

export default function ActivityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { token, user } = useAuthStore();
  const [activity, setActivity] = useState<ActivityDetail | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [message, setMessage] = useState("");

  const isOrganizer = user?.role === "admin" || user?.role === "shelter";
  const isVolunteer = user?.role === "volunteer";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    activityApi
      .get(Number(id))
      .then((res) => setActivity(res.data))
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));

    // 如果是组织者，加载报名列表
    if (isOrganizer && token) {
      activityApi
        .getEnrollments(Number(id))
        .then((res) => setEnrollments(res.data))
        .catch(() => {});
    }
  }, [id, token, isOrganizer]);

  const handleEnroll = async () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (!activity) return;
    setEnrolling(true);
    setMessage("");
    try {
      await activityApi.enroll(activity.id);
      setMessage("报名成功！");
      setActivity({ ...activity, enrolled_count: activity.enrolled_count + 1 });
    } catch (err: any) {
      setMessage(err.response?.data?.detail || "报名失败");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  if (!activity) return null;

  const isFull = activity.enrolled_count >= activity.max_participants;

  const statusTagClass =
    activity.status === "upcoming"
      ? "bg-[#fef3c7] text-[#d97706]"
      : activity.status === "ongoing"
      ? "bg-[#dcfce7] text-[#16a34a]"
      : "bg-[#e2e8f0] text-[#64748b]";

  return (
    <div className="max-w-[800px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="bg-none border-none text-[#78716c] cursor-pointer text-[14px] hover:text-[#ef4444]"
      >
        ← 返回
      </button>

      <h1 className="text-[28px] mt-2 mb-2">{activity.title}</h1>

      <span className={`inline-block px-3 py-1 rounded-[20px] text-[13px] font-semibold ${statusTagClass}`}>
        {STATUS_MAP[activity.status] || activity.status}
      </span>

      {message && (
        <div className="bg-[#f0fdf4] text-[#16a34a] px-4 py-2.5 rounded-[8px] mt-4 text-[14px]">
          {message}
        </div>
      )}

      {activity.cover_image && (
        <img
          src={activity.cover_image}
          alt={activity.title}
          className="w-full max-h-[400px] object-cover rounded-[12px] mt-4"
        />
      )}

      <div className="mt-4 text-[15px] text-[#292524] space-y-1">
        <p>📍 {activity.location}</p>
        <p>🕐 {new Date(activity.start_time).toLocaleString("zh-CN")} ~ {new Date(activity.end_time).toLocaleString("zh-CN")}</p>
        <p>👥 {activity.enrolled_count} / {activity.max_participants} 人报名</p>
      </div>

      <div
        className="article-content my-5"
        style={{ whiteSpace: "pre-wrap", lineHeight: 1.8 }}
      >
        {activity.description || "暂无详情描述"}
      </div>

      <div className="mt-4">
        {isVolunteer && activity.status === "upcoming" && !isFull && (
          <button
            onClick={handleEnroll}
            disabled={enrolling}
            className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {enrolling ? "报名中..." : "立即报名"}
          </button>
        )}
        {isVolunteer && isFull && (
          <span className="inline-block px-3 py-1 rounded-[20px] text-[13px] font-semibold bg-[#e2e8f0] text-[#64748b]">
            报名已满
          </span>
        )}
        {!token && activity.status === "upcoming" && (
          <button
            onClick={() => navigate("/login")}
            className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706]"
          >
            登录后报名
          </button>
        )}
        {activity.status === "completed" && (
          <span className="inline-block px-3 py-1 rounded-[20px] text-[13px] font-semibold bg-[#e2e8f0] text-[#64748b]">
            活动已结束
          </span>
        )}
        {!isVolunteer && !isOrganizer && token && activity.status !== "completed" && (
          <span className="inline-block px-3 py-1 rounded-[20px] text-[13px] font-semibold bg-[#f1f5f9] text-[#64748b]">
            仅志愿者可报名
          </span>
        )}
      </div>

      {/* 组织者查看报名列表 */}
      {isOrganizer && enrollments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[16px] mb-2">报名人员（{enrollments.length}人）</h3>
          <table className="w-full border-collapse bg-white rounded-[12px] overflow-hidden border border-[#e7e5e4] text-[14px]">
            <thead>
              <tr className="bg-[#fafaf9] text-left">
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">用户名</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">邮箱</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">备注</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">签到</th>
                <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">报名时间</th>
              </tr>
            </thead>
            <tbody>
              {enrollments.map((e) => (
                <tr key={e.id} className="border-b border-[#f5f5f4] last:border-b-0">
                  <td className="px-4 py-2.5">{e.user_name}</td>
                  <td className="px-4 py-2.5">{e.user_email}</td>
                  <td className="px-4 py-2.5">{e.note || "-"}</td>
                  <td className="px-4 py-2.5">
                    {e.is_checked_in ? (
                      <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] bg-[#dcfce7] text-[#166534]">已签到</span>
                    ) : (
                      <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] bg-[#f1f5f9] text-[#64748b]">未签到</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">{new Date(e.created_at).toLocaleString("zh-CN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
