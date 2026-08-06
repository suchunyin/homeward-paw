import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";

const STATUS_LABELS: Record<string, string> = {
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

interface Activity {
  id: number;
  title: string;
  description: string;
  cover_image: string;
  location: string;
  start_time: string;
  end_time: string;
  max_participants: number;
  status: string;
  organizer_id: number;
  enrolled_count: number;
  created_at: string;
  enrollments: Enrollment[];
}

export default function AdminActivitiesPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "shelter") {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await activityApi.manageList({
        page,
        page_size: 20,
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      });
      setActivities(res.data.items);
      setTotal(res.data.total);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchActivities();
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    try {
      await activityApi.updateStatus(id, newStatus);
      fetchActivities();
    } catch {
      alert("操作失败");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`确定删除活动「${title}」？`)) return;
    try {
      await activityApi.delete(id);
      fetchActivities();
    } catch {
      alert("删除失败");
    }
  };

  const toggleEnrollments = (id: number) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const formatTime = (t: string) => new Date(t).toLocaleString("zh-CN");
  const totalPages = Math.ceil(total / 20);

  if (!user || (user.role !== "admin" && user.role !== "shelter")) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px]">志愿活动管理</h1>
        <button
          onClick={() => navigate("/admin/activities/new")}
          className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706]"
        >
          发布活动
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none bg-white"
        >
          <option value="">全部状态</option>
          <option value="upcoming">招募中</option>
          <option value="ongoing">进行中</option>
          <option value="completed">已结束</option>
        </select>
        <input
          className="flex-1 min-w-[200px] px-3 py-2 border border-[#e7e5e4] rounded-[8px] text-[14px] outline-none focus:border-[#f59e0b]"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索活动标题..."
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
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">地点</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">时间</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">报名</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">状态</th>
                  <th className="px-4 py-2.5 border-b border-[#e7e5e4] text-[#78716c]">操作</th>
                </tr>
              </thead>
              <tbody>
                {activities.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#78716c]">暂无活动</td></tr>
                ) : (
                  activities.map((a) => (
                    <>
                      <tr key={a.id} className="border-b border-[#f5f5f4] last:border-b-0 hover:bg-[#fafaf9]">
                        <td className="px-4 py-2.5 font-medium">{a.title}</td>
                        <td className="px-4 py-2.5">{a.location}</td>
                        <td className="px-4 py-2.5">
                          {formatTime(a.start_time)} ~ {new Date(a.end_time).toLocaleString("zh-CN")}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            onClick={() => toggleEnrollments(a.id)}
                            className="px-2.5 py-1 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fafaf9]"
                          >
                            {a.enrolled_count}/{a.max_participants}人
                          </button>
                        </td>
                        <td className="px-4 py-2.5">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] ${
                              a.status === "upcoming"
                                ? "bg-[#fef3c7] text-[#d97706]"
                                : a.status === "ongoing"
                                ? "bg-[#dcfce7] text-[#16a34a]"
                                : "bg-[#e2e8f0] text-[#64748b]"
                            }`}
                          >
                            {STATUS_LABELS[a.status] || a.status}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/admin/activities/${a.id}/edit`)}
                              className="px-2.5 py-1 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fafaf9]"
                            >
                              编辑
                            </button>
                            {a.status !== "upcoming" && (
                              <button
                                onClick={() => handleStatusChange(a.id, "upcoming")}
                                className="px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer bg-[#f59e0b] text-white hover:bg-[#d97706]"
                              >
                                改招募
                              </button>
                            )}
                            {a.status !== "ongoing" && (
                              <button
                                onClick={() => handleStatusChange(a.id, "ongoing")}
                                className="px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                              >
                                进行中
                              </button>
                            )}
                            {a.status !== "completed" && (
                              <button
                                onClick={() => handleStatusChange(a.id, "completed")}
                                className="px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer bg-[#f59e0b] text-white hover:bg-[#d97706]"
                              >
                                结束
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(a.id, a.title)}
                              className="px-2.5 py-1 border-none rounded-[6px] text-[13px] cursor-pointer bg-[#ef4444] text-white hover:bg-[#dc2626]"
                            >
                              删除
                            </button>
                          </div>
                        </td>
                      </tr>
                      {expandedId === a.id && (
                        <tr key={`${a.id}-enroll`}>
                          <td colSpan={6} className="px-4 py-3 bg-[#fafaf9]">
                            <div className="p-4 bg-white rounded-[8px] border border-[#e7e5e4]">
                              <h4 className="text-[15px] mb-3">报名人员</h4>
                              {a.enrollments.length === 0 ? (
                                <p className="text-center py-8 text-[#78716c] text-[15px]">暂无报名</p>
                              ) : (
                                <table className="w-full border-collapse text-[13px]">
                                  <thead>
                                    <tr className="text-left">
                                      <th className="px-3 py-2 border-b border-[#e7e5e4] text-[#78716c]">用户名</th>
                                      <th className="px-3 py-2 border-b border-[#e7e5e4] text-[#78716c]">邮箱</th>
                                      <th className="px-3 py-2 border-b border-[#e7e5e4] text-[#78716c]">备注</th>
                                      <th className="px-3 py-2 border-b border-[#e7e5e4] text-[#78716c]">签到状态</th>
                                      <th className="px-3 py-2 border-b border-[#e7e5e4] text-[#78716c]">报名时间</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {a.enrollments.map((e) => (
                                      <tr key={e.id} className="border-b border-[#f5f5f4] last:border-b-0">
                                        <td className="px-3 py-2">{e.user_name}</td>
                                        <td className="px-3 py-2">{e.user_email}</td>
                                        <td className="px-3 py-2">{e.note || "-"}</td>
                                        <td className="px-3 py-2">
                                          {e.is_checked_in ? (
                                            <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] bg-[#dcfce7] text-[#166534]">已签到</span>
                                          ) : (
                                            <span className="inline-block px-2.5 py-0.5 rounded-[6px] text-[13px] bg-[#f1f5f9] text-[#64748b]">未签到</span>
                                          )}
                                        </td>
                                        <td className="px-3 py-2">{formatTime(e.created_at)}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
