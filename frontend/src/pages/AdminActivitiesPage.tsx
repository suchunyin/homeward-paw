import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Card, CardContent } from "../components/ui/card";

const STATUS_LABELS: Record<string, string> = {
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
      toast.error("操作失败");
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`确定删除活动「${title}」？`)) return;
    try {
      await activityApi.delete(id);
      fetchActivities();
    } catch {
      toast.error("删除失败");
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
        <h1 className="text-[24px] font-semibold">志愿活动管理</h1>
        <Button onClick={() => navigate("/admin/activities/new")} className="bg-amber-500 hover:bg-amber-600 text-white">发布活动</Button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-[140px] h-9 text-[14px]">
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="upcoming">招募中</SelectItem>
            <SelectItem value="ongoing">进行中</SelectItem>
            <SelectItem value="completed">已结束</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="flex-1 min-w-[200px] h-9 text-[14px] bg-white"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          placeholder="搜索活动标题..."
        />
        <Button onClick={handleSearch} size="sm" className="bg-amber-500 hover:bg-amber-600 text-white">
          搜索
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>
      ) : (
        <>
          <div className="rounded-[12px] border border-[hsl(var(--border))] overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>地点</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>报名</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-[#78716c]">
                      暂无活动
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.title}</TableCell>
                      <TableCell>{a.location}</TableCell>
                      <TableCell>
                        {formatTime(a.start_time)} ~ {new Date(a.end_time).toLocaleString("zh-CN")}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleEnrollments(a.id)}
                        >
                          {a.enrolled_count}/{a.max_participants}人
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={STATUS_BADGE_MAP[a.status] || "secondary"}>
                          {STATUS_LABELS[a.status] || a.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/admin/activities/${a.id}/edit`)}
                          >
                            编辑
                          </Button>
                          {a.status !== "upcoming" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStatusChange(a.id, "upcoming")}
                            >
                              改招募
                            </Button>
                          )}
                          {a.status !== "ongoing" && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handleStatusChange(a.id, "ongoing")}
                            >
                              进行中
                            </Button>
                          )}
                          {a.status !== "completed" && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleStatusChange(a.id, "completed")}
                            >
                              结束
                            </Button>
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(a.id, a.title)}
                          >
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Expandable enrollments */}
          {expandedId && (() => {
            const a = activities.find((x) => x.id === expandedId);
            if (!a) return null;
            return (
              <Card className="mt-4">
                <CardContent className="p-4">
                  <h4 className="text-[15px] font-medium mb-3">报名人员</h4>
                  {a.enrollments.length === 0 ? (
                    <p className="text-center py-8 text-[#78716c] text-[15px]">暂无报名</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>用户名</TableHead>
                          <TableHead>邮箱</TableHead>
                          <TableHead>备注</TableHead>
                          <TableHead>签到状态</TableHead>
                          <TableHead>报名时间</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {a.enrollments.map((e) => (
                          <TableRow key={e.id}>
                            <TableCell>{e.user_name}</TableCell>
                            <TableCell>{e.user_email}</TableCell>
                            <TableCell>{e.note || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={e.is_checked_in ? "success" : "secondary"}>
                                {e.is_checked_in ? "已签到" : "未签到"}
                              </Badge>
                            </TableCell>
                            <TableCell>{formatTime(e.created_at)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            );
          })()}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                size="sm"
              >
                上一页
              </Button>
              <span className="text-[14px] text-[#78716c]">
                第 {page}/{totalPages} 页（共 {total} 条）
              </span>
              <Button
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                size="sm"
              >
                下一页
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
