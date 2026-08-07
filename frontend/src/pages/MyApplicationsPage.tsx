import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adoptionApi, PET_EXPERIENCE_MAP, HOUSING_TYPE_MAP, type AdoptionApplication } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";

const ADOPTION_STATUS_MAP: Record<string, { label: string; color: "warning" | "success" | "destructive" | "secondary" | "info" }> = {
  pending: { label: "等待审核", color: "warning" },
  approved: { label: "已通过", color: "success" },
  rejected: { label: "已拒绝", color: "destructive" },
  cancelled: { label: "已取消", color: "secondary" },
  completed: { label: "已完成", color: "info" },
};

export default function MyApplicationsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    adoptionApi.list()
      .then((res) => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token, navigate]);

  if (!token) return null;

  return (
    <div className="max-w-[800px] mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-semibold">我的领养申请</h1>
      </div>

      {loading ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>
      ) : applications.length === 0 ? (
        <div className="text-center py-[60px] text-[#78716c]">
          <div className="text-[64px] mb-4">📋</div>
          <p className="text-[15px] mb-4">您还没有提交过领养申请</p>
          <Button onClick={() => navigate("/")} variant="outline">
            去看看等待领养的动物
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const statusInfo = ADOPTION_STATUS_MAP[app.status] || { label: app.status, color: "secondary" as const };
            return (
              <Card key={app.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    {/* 宠物封面 */}
                    <div
                      className="w-[80px] h-[80px] rounded-lg bg-[#fef3c7] flex-shrink-0 overflow-hidden cursor-pointer"
                      onClick={() => navigate(`/pet/${app.pet_id}`)}
                    >
                      {app.pet_cover_image ? (
                        <img
                          src={app.pet_cover_image}
                          alt={app.pet_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[36px]">🐾</div>
                      )}
                    </div>

                    {/* 申请信息 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3
                          className="text-[16px] font-medium truncate cursor-pointer hover:text-[#d97706]"
                          onClick={() => navigate(`/pet/${app.pet_id}`)}
                        >
                          {app.pet_name || `宠物 #${app.pet_id}`}
                        </h3>
                        <Badge variant={statusInfo.color}>{statusInfo.label}</Badge>
                      </div>
                      {app.pet_breed && (
                        <p className="text-[13px] text-[#78716c] mt-0.5">{app.pet_breed}</p>
                      )}
                      <p className="text-[12px] text-[#a8a29e] mt-1">
                        申请时间：{new Date(app.created_at).toLocaleString("zh-CN")}
                      </p>

                      {/* 状态提示文案 */}
                      <p className="text-[13px] mt-2 text-[#78716c]">
                        {app.status === "pending" && "您的申请正在审核中，请耐心等待救助站联系您。"}
                        {app.status === "approved" && "恭喜！您的领养申请已通过。"}
                        {app.status === "rejected" && "很遗憾，您的领养申请未被通过。"}
                        {app.status === "completed" && "领养流程已完成，感谢您给小动物一个温暖的家！"}
                        {app.status === "cancelled" && "该申请已被取消。"}
                      </p>

                      {/* 救助站回复 */}
                      {app.reply && (
                        <div className="mt-2 p-2 rounded bg-[#fef3c7] text-[13px] text-[#292524]">
                          💬 救助站回复：{app.reply}
                        </div>
                      )}

                      {/* 申请详情折叠区 */}
                      <details className="mt-2">
                        <summary className="text-[13px] text-[#d97706] cursor-pointer">查看申请详情</summary>
                        <div className="mt-2 p-3 rounded bg-[#fafaf9] text-[13px] text-[#44403c] space-y-1">
                          <p>真实姓名：{app.real_name}</p>
                          <p>联系电话：{app.phone}</p>
                          <p>住房类型：{HOUSING_TYPE_MAP[app.housing_type] || app.housing_type}</p>
                          <p>已封窗：{app.has_sealed_window ? "是" : "否"}</p>
                          <p>家人同意：{app.family_agree ? "是" : "否"}</p>
                          <p>家人过敏：{app.family_allergy ? "是" : "否"}</p>
                          <p>养宠经历：{PET_EXPERIENCE_MAP[app.pet_experience] || app.pet_experience || "无"}</p>
                          <p>领养理由：{app.reason}</p>
                          {app.message && <p>补充留言：{app.message}</p>}
                        </div>
                      </details>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
