import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";

const STATUS_MAP: Record<string, string> = {
  upcoming: "招募中",
  ongoing: "进行中",
  completed: "已结束",
};

const STATUS_BADGE_MAP: Record<string, "warning" | "success" | "secondary"> = {
  upcoming: "warning",
  ongoing: "success",
  completed: "secondary",
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

  return (
    <div className="max-w-[800px] mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-[#78716c] hover:text-[#ef4444]">
        ← 返回
      </Button>

      <h1 className="text-[28px] mt-2 mb-2 font-semibold">{activity.title}</h1>

      <Badge variant={STATUS_BADGE_MAP[activity.status] || "secondary"} className="text-[13px]">
        {STATUS_MAP[activity.status] || activity.status}
      </Badge>

      {message && (
        <div className={`px-4 py-2.5 rounded-[8px] mt-4 text-[14px] ${
          message.includes("成功") ? "bg-[#f0fdf4] text-[#16a34a]" : "bg-[#fef2f2] text-[#ef4444]"
        }`}>
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

      <div className="my-5 whitespace-pre-wrap leading-[1.8]">
        {activity.description || "暂无详情描述"}
      </div>

      <div className="mt-4">
        {isVolunteer && activity.status === "upcoming" && !isFull && (
          <Button onClick={handleEnroll} disabled={enrolling}>
            {enrolling ? "报名中..." : "立即报名"}
          </Button>
        )}
        {isVolunteer && isFull && (
          <Badge variant="secondary">报名已满</Badge>
        )}
        {!token && activity.status === "upcoming" && (
          <Button onClick={() => navigate("/login")}>
            登录后报名
          </Button>
        )}
        {activity.status === "completed" && (
          <Badge variant="secondary">活动已结束</Badge>
        )}
        {!isVolunteer && !isOrganizer && token && activity.status !== "completed" && (
          <Badge variant="secondary">仅志愿者可报名</Badge>
        )}
      </div>

      {isOrganizer && enrollments.length > 0 && (
        <div className="mt-8">
          <h3 className="text-[16px] mb-2 font-medium">报名人员（{enrollments.length}人）</h3>
          <div className="rounded-[12px] border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用户名</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>备注</TableHead>
                  <TableHead>签到</TableHead>
                  <TableHead>报名时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.user_name}</TableCell>
                    <TableCell>{e.user_email}</TableCell>
                    <TableCell>{e.note || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={e.is_checked_in ? "success" : "secondary"}>
                        {e.is_checked_in ? "已签到" : "未签到"}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(e.created_at).toLocaleString("zh-CN")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
}
