import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { petApi, adoptionApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

interface PetInfo {
  id: number;
  name: string;
  species: string;
  breed: string;
  cover_image: string;
  status: string;
}

interface FormData {
  realName: string;
  phone: string;
  housingType: string;
  hasSealedWindow: boolean;
  familyAgree: boolean;
  familyAllergy: boolean;
  petExperience: string;
  reason: string;
  agreeTerms: boolean;
  agreeFollowUp: boolean;
}

const SPECIES_MAP: Record<string, string> = {
  狗: "🐶",
  猫: "🐱",
  default: "🐾",
};

const HOUSING_OPTIONS = [
  { value: "own_house", label: "自有住房" },
  { value: "rent_long", label: "长期租房（1年+）" },
  { value: "rent_short", label: "短期租房" },
  { value: "dorm", label: "学校宿舍" },
  { value: "other", label: "其他" },
] as const;

const PET_EXP_OPTIONS = [
  { value: "none", label: "从未养过" },
  { value: "some", label: "养过但目前没有" },
  { value: "current", label: "目前正在养" },
  { value: "professional", label: "丰富经验" },
] as const;

const INITIAL_FORM: FormData = {
  realName: "",
  phone: "",
  housingType: "",
  hasSealedWindow: false,
  familyAgree: false,
  familyAllergy: false,
  petExperience: "",
  reason: "",
  agreeTerms: false,
  agreeFollowUp: false,
};

export default function AdoptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [pet, setPet] = useState<PetInfo | null>(null);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({ ...INITIAL_FORM });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!id) return;
    petApi
      .get(Number(id))
      .then((res) => {
        const data = res.data as PetInfo;
        setPet(data);
        if (data.status !== "available") {
          setError("该宠物暂时不可领养");
        }
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.realName.trim()) errs.realName = "请输入真实姓名";
    if (!form.phone.trim()) errs.phone = "请输入手机号";
    if (!form.housingType) errs.housingType = "请选择住房类型";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.petExperience) errs.petExperience = "请选择养宠经验";
    if (!form.reason.trim()) errs.reason = "请填写领养原因";
    if (!form.agreeTerms) errs.agreeTerms = "请阅读并同意领养协议";
    if (!form.agreeFollowUp) errs.agreeFollowUp = "请同意接受回访";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const goNext = () => {
    setError("");
    if (step === 1) {
      if (!validateStep1()) return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    setError("");
    setStep(1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    if (submitted) return;
    setError("");
    setSuccess("");

    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    if (!pet) return;
    if (pet.status !== "available") {
      setError("该宠物暂时不可领养");
      return;
    }
    if (!validateStep2()) return;

    setSubmitting(true);
    try {
      await adoptionApi.create({
        pet_id: pet.id,
        real_name: form.realName.trim(),
        phone: form.phone.trim(),
        housing_type: form.housingType,
        has_sealed_window: form.hasSealedWindow,
        family_agree: form.familyAgree,
        family_allergy: form.familyAllergy,
        pet_experience: form.petExperience,
        reason: form.reason.trim(),
        agree_terms: form.agreeTerms,
        agree_follow_up: form.agreeFollowUp,
      });
      setSuccess("领养申请已提交成功！救助站会尽快审核，请留意申请状态。");
      setSubmitted(true);
    } catch (err: any) {
      const detail = err.response?.data?.detail || "提交失败，请稍后重试";
      setError(typeof detail === "string" ? detail : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = submitted || pet?.status !== "available";

  if (loading) {
    return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  }
  if (!pet) return null;

  return (
    <div className="max-w-[800px] mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-[#78716c] hover:text-[#ef4444]">
        ← 返回
      </Button>

      <h1 className="text-[24px] font-semibold mt-4 mb-6">申请领养</h1>

      {/* 宠物摘要卡片 */}
      <Card className="mb-6">
        <CardContent className="p-4 flex items-center gap-4">
          {pet.cover_image ? (
            <img
              src={pet.cover_image}
              alt={pet.name}
              className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-lg bg-[#fef3c7] flex items-center justify-center text-[40px] flex-shrink-0">
              🐾
            </div>
          )}
          <div>
            <h2 className="text-[18px] font-semibold">{pet.name}</h2>
            <p className="text-[13px] text-[#78716c]">
              {SPECIES_MAP[pet.species] || SPECIES_MAP["default"]} {pet.breed}
            </p>
            <Badge variant={pet.status === "available" ? "success" : "secondary"} className="mt-1">
              {pet.status === "available" ? "可领养" : "不可领养"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* 进度条 */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[13px] font-medium ${step >= 1 ? "text-amber-500" : "text-[#a8a29e]"}`}>
            基本信息
          </span>
          <span className="text-[#d6d3d1]">-</span>
          <span className={`text-[13px] font-medium ${step >= 2 ? "text-amber-500" : "text-[#a8a29e]"}`}>
            养宠意愿
          </span>
        </div>
        <div className="flex gap-2">
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 1 ? "bg-amber-500" : "bg-[#e7e5e4]"}`} />
          <div className={`h-1.5 flex-1 rounded-full transition-colors ${step >= 2 ? "bg-amber-500" : "bg-[#e7e5e4]"}`} />
        </div>
      </div>

      {/* 错误提示 */}
      {error && <div className="mb-4 p-3 rounded-md bg-[#fef2f2] text-[#ef4444] text-[14px]">{error}</div>}

      {/* 成功提示 */}
      {success && (
        <div className="mb-4 p-4 rounded-md bg-[#f0fdf4] text-[#16a34a] text-[15px] leading-relaxed">
          <p>{success}</p>
          <Button
            variant="outline"
            className="mt-3 border-[#16a34a] text-[#16a34a] hover:bg-[#dcfce7]"
            onClick={() => navigate("/my-applications")}
          >
            查看我的申请 →
          </Button>
        </div>
      )}

      {/* Step 1: 基本信息 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[18px]">基本信息</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 真实姓名 */}
            <div>
              <Label htmlFor="realName">
                真实姓名 <span className="text-[#ef4444]">*</span>
              </Label>
              <input
                id="realName"
                type="text"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:border-amber-500 ${fieldErrors.realName ? "border-[#ef4444]" : "border-[#d6d3d1]"}`}
                placeholder="请输入你的真实姓名"
                value={form.realName}
                onChange={(e) => updateField("realName", e.target.value)}
                disabled={disabled}
              />
              {fieldErrors.realName && <p className="mt-1 text-[12px] text-[#ef4444]">{fieldErrors.realName}</p>}
            </div>

            {/* 手机号 */}
            <div>
              <Label htmlFor="phone">
                手机号 <span className="text-[#ef4444]">*</span>
              </Label>
              <input
                id="phone"
                type="tel"
                className={`mt-1 w-full rounded-md border px-3 py-2 text-[14px] outline-none focus:border-amber-500 ${fieldErrors.phone ? "border-[#ef4444]" : "border-[#d6d3d1]"}`}
                placeholder="请输入你的手机号"
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                disabled={disabled}
              />
              {fieldErrors.phone && <p className="mt-1 text-[12px] text-[#ef4444]">{fieldErrors.phone}</p>}
            </div>

            {/* 住房类型 */}
            <div>
              <Label>
                住房类型 <span className="text-[#ef4444]">*</span>
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {HOUSING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
                      form.housingType === opt.value
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => updateField("housingType", opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {fieldErrors.housingType && (
                <p className="mt-1 text-[12px] text-[#ef4444]">{fieldErrors.housingType}</p>
              )}
            </div>

            {/* 是否封窗 */}
            <div>
              <Label>是否封窗/封阳台？ <span className="text-[#ef4444]">*</span></Label>
              <p className="text-[12px] text-[#78716c] mb-1.5">
                封窗是防止猫咪坠楼/走失的重要安全措施，所有养猫家庭必须封窗封阳台
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.hasSealedWindow
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("hasSealedWindow", true)}
                >
                  已封窗/阳台
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.hasSealedWindow === false
                      ? "bg-[#fee2e2] text-[#ef4444] border-[#fecaca]"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("hasSealedWindow", false)}
                >
                  未封窗
                </button>
              </div>
            </div>

            {/* 家人同意 */}
            <div>
              <Label>家人/室友是否同意养宠？ <span className="text-[#ef4444]">*</span></Label>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.familyAgree
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("familyAgree", true)}
                >
                  同意
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.familyAgree === false
                      ? "bg-[#fee2e2] text-[#ef4444] border-[#fecaca]"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("familyAgree", false)}
                >
                  未同意
                </button>
              </div>
            </div>

            {/* 家人过敏 */}
            <div>
              <Label>家人/室友是否有人过敏？ <span className="text-[#ef4444]">*</span></Label>
              <div className="flex gap-2 mt-1.5">
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.familyAllergy
                      ? "bg-[#fee2e2] text-[#ef4444] border-[#fecaca]"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("familyAllergy", true)}
                >
                  有人过敏
                </button>
                <button
                  type="button"
                  disabled={disabled}
                  className={`px-4 py-1.5 rounded-full text-[13px] border transition-colors ${
                    form.familyAllergy === false
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                  } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={() => updateField("familyAllergy", false)}
                >
                  无人过敏
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 养宠意愿 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-[18px]">养宠意愿</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* 养宠经验 */}
            <div>
              <Label>
                养宠经验 <span className="text-[#ef4444]">*</span>
              </Label>
              <div className="mt-1.5 flex flex-wrap gap-2">
                {PET_EXP_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    className={`px-3 py-1.5 rounded-full text-[13px] border transition-colors ${
                      form.petExperience === opt.value
                        ? "bg-amber-500 text-white border-amber-500"
                        : "bg-white text-[#57534e] border-[#d6d3d1] hover:border-amber-400"
                    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={() => updateField("petExperience", opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {fieldErrors.petExperience && (
                <p className="mt-1 text-[12px] text-[#ef4444]">{fieldErrors.petExperience}</p>
              )}
            </div>

            {/* 领养原因 */}
            <div>
              <Label htmlFor="reason">
                领养原因 <span className="text-[#ef4444]">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="请介绍你的养宠动机、家庭环境、是否有养宠经验等，真诚的留言有助于救助站了解你…"
                value={form.reason}
                onChange={(e) => updateField("reason", e.target.value)}
                rows={4}
                disabled={disabled}
                className={`resize-none ${fieldErrors.reason ? "border-[#ef4444]" : ""}`}
              />
              {fieldErrors.reason && <p className="mt-1 text-[12px] text-[#ef4444]">{fieldErrors.reason}</p>}
            </div>

            {/* 同意协议 */}
            <div className="space-y-3">
              <label
                className={`flex items-start gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={form.agreeTerms}
                  onChange={(e) => updateField("agreeTerms", e.target.checked)}
                  disabled={disabled}
                  className="mt-1 accent-amber-500"
                />
                <span className="text-[13px] text-[#57534e] leading-relaxed">
                  我已阅读并同意《领养协议》，承诺领养后善待宠物，不遗弃、不虐待、不转送，如因特殊原因无法继续饲养将联系救助站协商处理
                </span>
              </label>
              {fieldErrors.agreeTerms && (
                <p className="text-[12px] text-[#ef4444]">{fieldErrors.agreeTerms}</p>
              )}

              <label
                className={`flex items-start gap-2 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={form.agreeFollowUp}
                  onChange={(e) => updateField("agreeFollowUp", e.target.checked)}
                  disabled={disabled}
                  className="mt-1 accent-amber-500"
                />
                <span className="text-[13px] text-[#57534e] leading-relaxed">
                  我同意接受救助站的定期回访（线上照片/视频），与救助站保持良好沟通
                </span>
              </label>
              {fieldErrors.agreeFollowUp && (
                <p className="text-[12px] text-[#ef4444]">{fieldErrors.agreeFollowUp}</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 底部按钮 */}
      <div className="flex gap-3 mt-6">
        {step === 2 && (
          <Button variant="outline" onClick={goPrev} disabled={submitting} className="flex-1">
            上一步
          </Button>
        )}
        {step === 1 && (
          <>
            <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting} className="flex-1">
              取消
            </Button>
            <Button
              onClick={goNext}
              disabled={disabled}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
            >
              下一步
            </Button>
          </>
        )}
        {step === 2 && (
          <Button
            onClick={handleSubmit}
            disabled={disabled || submitting}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white"
          >
            {submitting ? "提交中..." : submitted ? "已提交" : "提交申请"}
          </Button>
        )}
      </div>
    </div>
  );
}
