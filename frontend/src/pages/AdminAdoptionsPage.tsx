import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Check,
  CheckCircle,
  X,
  XCircle,
  RefreshCw,
  PawPrint,
  User,
  Phone,
  Calendar,
  Home,
  ShieldCheck,
  Users,
  AlertTriangle,
  Heart,
  FileText,
  MessageSquare,
  ClipboardList,
} from "lucide-react";
import { adoptionApi, PET_EXPERIENCE_MAP, HOUSING_TYPE_MAP, type AdoptionApplication } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent } from "../components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Textarea } from "../components/ui/textarea";
import { Label } from "../components/ui/label";

const ADOPTION_STATUS_MAP: Record<string, { label: string; color: "warning" | "success" | "destructive" | "secondary" | "info" }> = {
  pending: { label: "等待审核", color: "warning" },
  approved: { label: "已通过", color: "success" },
  rejected: { label: "已拒绝", color: "destructive" },
  cancelled: { label: "已取消", color: "secondary" },
  completed: { label: "已完成", color: "info" },
};

export default function AdminAdoptionsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const [applications, setApplications] = useState<AdoptionApplication[]>([]);
  const [loading, setLoading] = useState(true);

  // 审核对话框
  const [reviewTarget, setReviewTarget] = useState<AdoptionApplication | null>(null);
  const [reviewAction, setReviewAction] = useState<"approved" | "rejected">("approved");
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isAdminOrShelter = user?.role === "admin" || user?.role === "shelter";

  const fetchApplications = () => {
    adoptionApi.listReceived()
      .then((res) => setApplications(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (!isAdminOrShelter) {
      navigate("/", { replace: true });
      return;
    }
    fetchApplications();
  }, [token, isAdminOrShelter, navigate]);

  const handleStartReview = (app: AdoptionApplication, action: "approved" | "rejected") => {
    setReviewTarget(app);
    setReviewAction(action);
    setReplyText("");
  };

  const handleSubmitReview = async () => {
    if (!reviewTarget) return;
    setSubmitting(true);
    try {
      await adoptionApi.update(reviewTarget.id, {
        status: reviewAction,
        reply: replyText,
      });
      fetchApplications();
      setReviewTarget(null);
      setSubmitting(false);
    } catch {
      toast.error("操作失败，请重试");
      setSubmitting(false);
    }
  };

  if (!token || !isAdminOrShelter) return null;

  return (
    <div className="max-w-[1000px] mx-auto">
      {/* ─── 页头 ─── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[24px] font-semibold text-[#292524]">领养申请审核</h1>
          <p className="text-[14px] text-[#78716c] mt-1">
            {user?.role === "admin" ? "查看所有领养申请" : "查看您发布宠物的领养申请"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchApplications} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          刷新
        </Button>
      </div>

      {/* ─── 加载中 ─── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-[80px] text-[#a8a29e]">
          <RefreshCw className="w-8 h-8 animate-spin mb-3" />
          <p className="text-[15px]">加载中...</p>
        </div>
      )}

      {/* ─── 空状态 ─── */}
      {!loading && applications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-[80px] text-[#a8a29e]">
          <ClipboardList className="w-16 h-16 mb-4 stroke-[1.5]" />
          <p className="text-[15px] font-medium text-[#78716c]">暂无领养申请</p>
          <p className="text-[13px] mt-1">还没有用户提交领养申请</p>
        </div>
      )}

      {/* ─── 申请列表 ─── */}
      {!loading && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => {
            const statusInfo = ADOPTION_STATUS_MAP[app.status] || { label: app.status, color: "secondary" as const };
            return (
              <Card key={app.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardContent className="p-5">
                  <div className="flex gap-4">
                    {/* 宠物封面 */}
                    <div
                      className="w-[88px] h-[88px] rounded-xl bg-[#fef3c7] flex-shrink-0 overflow-hidden cursor-pointer border border-[#fde68a] hover:ring-2 hover:ring-[#fbbf24]/40 transition-all"
                      onClick={() => navigate(`/pet/${app.pet_id}`)}
                    >
                      {app.pet_cover_image ? (
                        <img
                          src={app.pet_cover_image}
                          alt={app.pet_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <PawPrint className="w-10 h-10 text-[#d97706]" />
                        </div>
                      )}
                    </div>

                    {/* 右侧内容 */}
                    <div className="flex-1 min-w-0">
                      {/* 顶部：宠物名 + 状态标签 */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 min-w-0">
                          <h3
                            className="text-[16px] font-semibold truncate cursor-pointer hover:text-[#d97706] transition-colors"
                            onClick={() => navigate(`/pet/${app.pet_id}`)}
                          >
                            {app.pet_name || `宠物 #${app.pet_id}`}
                          </h3>
                          {app.pet_breed && (
                            <span className="text-[12px] text-[#a8a29e] bg-[#f5f5f4] px-2 py-0.5 rounded-full">
                              {app.pet_breed}
                            </span>
                          )}
                        </div>
                        <Badge variant={statusInfo.color} className="text-[12px]">
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {/* 申请人基本信息 */}
                      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-2 text-[13px] text-[#57534e]">
                        <span className="inline-flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-[#a8a29e]" />
                          {app.applicant_name || app.real_name || "未知"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-[#a8a29e]" />
                          {app.applicant_phone || app.phone}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[#a8a29e]">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(app.created_at).toLocaleString("zh-CN")}
                        </span>
                      </div>

                      {/* 申请人详情折叠区 */}
                      <details className="mt-3 group">
                        <summary className="text-[13px] text-[#d97706] cursor-pointer hover:text-[#b45309] transition-colors select-none">
                          查看申请人详情
                        </summary>
                        <div className="mt-3 p-4 rounded-xl bg-[#fafaf9] border border-[#e7e5e4] text-[13px] text-[#44403c] space-y-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <DetailItem icon={<Home className="w-3.5 h-3.5" />} label="住房类型">
                              {HOUSING_TYPE_MAP[app.housing_type] || app.housing_type}
                            </DetailItem>
                            <DetailItem
                              icon={<ShieldCheck className="w-3.5 h-3.5" />}
                              label="已封窗"
                              positive={app.has_sealed_window}
                            />
                            <DetailItem
                              icon={<Users className="w-3.5 h-3.5" />}
                              label="家人同意"
                              positive={app.family_agree}
                            />
                            <DetailItem
                              icon={<AlertTriangle className="w-3.5 h-3.5" />}
                              label="家人过敏"
                              positive={!app.family_allergy}
                              danger={app.family_allergy}
                            />
                            <DetailItem icon={<Heart className="w-3.5 h-3.5" />} label="养宠经历">
                              {PET_EXPERIENCE_MAP[app.pet_experience] || app.pet_experience || "无"}
                            </DetailItem>
                          </div>
                          {app.reason && (
                            <DetailItem icon={<FileText className="w-3.5 h-3.5" />} label="领养理由" full>
                              {app.reason}
                            </DetailItem>
                          )}
                          {app.message && (
                            <DetailItem icon={<MessageSquare className="w-3.5 h-3.5" />} label="补充留言" full>
                              {app.message}
                            </DetailItem>
                          )}
                          {app.reply && (
                            <div className="mt-3 p-3 rounded-lg bg-[#eff6ff] border border-[#bfdbfe] flex items-start gap-2">
                              <MessageSquare className="w-3.5 h-3.5 text-[#3b82f6] mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-medium text-[#1d4ed8]">审核回复：</span>
                                <span className="text-[#1e40af]">{app.reply}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </details>

                      {/* 操作按钮 */}
                      {app.status === "pending" && (
                        <div className="mt-3 flex gap-2">
                          <Button
                            size="sm"
                            className="bg-[#22c55e] hover:bg-[#16a34a] h-8 text-[13px] gap-1.5"
                            onClick={() => handleStartReview(app, "approved")}
                          >
                            <Check className="w-3.5 h-3.5" />
                            通过
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="h-8 text-[13px] gap-1.5"
                            onClick={() => handleStartReview(app, "rejected")}
                          >
                            <X className="w-3.5 h-3.5" />
                            拒绝
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─── 审核对话框 ─── */}
      <Dialog open={!!reviewTarget} onOpenChange={(open) => { if (!open) setReviewTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {reviewAction === "approved" ? (
                <>
                  <CheckCircle className="w-5 h-5 text-[#22c55e]" />
                  <span>通过申请</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-[#ef4444]" />
                  <span>拒绝申请</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {reviewTarget && (
            <div className="space-y-4">
              <div className="text-[14px] text-[#44403c] space-y-1.5 p-3 rounded-lg bg-[#fafaf9] border border-[#e7e5e4]">
                <p className="flex items-center gap-2">
                  <PawPrint className="w-4 h-4 text-[#d97706]" />
                  <strong>宠物：</strong>
                  {reviewTarget.pet_name || `#${reviewTarget.pet_id}`}
                  {reviewTarget.pet_breed && (
                    <span className="text-[#a8a29e]">（{reviewTarget.pet_breed}）</span>
                  )}
                </p>
                <p className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#a8a29e]" />
                  <strong>申请人：</strong>
                  {reviewTarget.applicant_name || reviewTarget.real_name}
                </p>
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#a8a29e]" />
                  <strong>电话：</strong>
                  {reviewTarget.applicant_phone || reviewTarget.phone}
                </p>
              </div>

              <div>
                <Label htmlFor="reply" className="text-[13px] font-medium">
                  审核回复（选填）
                </Label>
                <Textarea
                  id="reply"
                  className="mt-1.5"
                  placeholder={
                    reviewAction === "approved"
                      ? "例如：恭喜通过！请尽快联系救助站办理领养手续。"
                      : "例如：很抱歉，您的条件暂不符合领养要求。"
                  }
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setReviewTarget(null)} disabled={submitting}>
              取消
            </Button>
            <Button
              onClick={handleSubmitReview}
              disabled={submitting}
              className={reviewAction === "approved" ? "bg-[#22c55e] hover:bg-[#16a34a] gap-1.5" : "gap-1.5"}
              variant={reviewAction === "rejected" ? "destructive" : "default"}
            >
              {submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  提交中...
                </>
              ) : reviewAction === "approved" ? (
                <>
                  <Check className="w-4 h-4" />
                  确认通过
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  确认拒绝
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** 申请详情行 */
function DetailItem({
  icon,
  label,
  children,
  positive,
  danger,
  full,
}: {
  icon: React.ReactNode;
  label: string;
  children?: React.ReactNode;
  positive?: boolean;
  danger?: boolean;
  full?: boolean;
}) {
  const wrapperClass = full ? "sm:col-span-2" : "";
  return (
    <div className={`flex items-start gap-2 ${wrapperClass}`}>
      <span className="text-[#a8a29e] mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-[#78716c] flex-shrink-0">{label}：</span>
      {children !== undefined ? (
        <span className="text-[#44403c]">{children}</span>
      ) : positive !== undefined ? (
        danger ? (
          <span className="inline-flex items-center gap-1 text-[#ef4444] font-medium">
            <AlertTriangle className="w-3.5 h-3.5" />是
          </span>
        ) : positive ? (
          <span className="inline-flex items-center gap-1 text-[#22c55e] font-medium">
            <Check className="w-3.5 h-3.5" />是
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-[#ef4444] font-medium">
            <X className="w-3.5 h-3.5" />否
          </span>
        )
      ) : null}
    </div>
  );
}
