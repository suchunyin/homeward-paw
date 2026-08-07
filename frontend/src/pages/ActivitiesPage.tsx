import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { activityApi } from "../api";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

const STATUS_MAP: Record<string, string> = {
  upcoming: "即将开始",
  ongoing: "进行中",
  completed: "已结束",
  cancelled: "已取消",
};

const STATUS_BADGE_MAP: Record<string, "warning" | "success" | "secondary" | "destructive"> = {
  upcoming: "warning",
  ongoing: "success",
  completed: "secondary",
  cancelled: "destructive",
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
          <Select
            value={status}
            onValueChange={(v) => { setStatus(v); setPage(1); }}
          >
            <SelectTrigger className="min-w-[130px]">
              <SelectValue placeholder="全部状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              {Object.entries(STATUS_MAP).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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
                  <Badge variant={STATUS_BADGE_MAP[a.status] || "warning"} className="mb-1.5">
                    {STATUS_MAP[a.status] || a.status}
                  </Badge>
                  <h3 className="text-[17px] mb-1 font-medium">{a.title}</h3>
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
              <Button
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                size="sm"
              >
                上一页
              </Button>
              <span className="text-[14px] text-[#78716c]">{page} / {totalPages}</span>
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
        </div>
      )}
    </div>
  );
}
