import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { petApi, adoptionApi, type AdoptionApplication } from "../api";
import { useAuthStore } from "../stores/authStore";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";

interface PetDetail {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  color: string;
  description: string;
  health_status: string;
  is_vaccinated: boolean;
  is_neutered: boolean;
  city: string;
  district: string;
  cover_image: string;
  images: string;
  status: string;
  owner_id: number;
  created_at: string;
}

const GENDER_MAP: Record<string, string> = {
  male: "公",
  female: "母",
  unknown: "未知",
};

const STATUS_MAP: Record<string, string> = {
  available: "可领养",
  pending: "审核中",
  adopted: "已领养",
  hidden: "已隐藏",
};

const ADOPTION_STATUS_MAP: Record<string, { label: string; color: "warning" | "success" | "destructive" | "secondary" | "info" }> = {
  pending: { label: "等待审核", color: "warning" },
  approved: { label: "已通过", color: "success" },
  rejected: { label: "已拒绝", color: "destructive" },
  cancelled: { label: "已取消", color: "secondary" },
  completed: { label: "已完成", color: "info" },
};

const SPECIES_MAP: Record<string, string> = {
  "狗": "🐶",
  "猫": "🐱",
  default: "🐾",
};

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [pet, setPet] = useState<PetDetail | null>(null);
  const [myApplication, setMyApplication] = useState<AdoptionApplication | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const petId = Number(id);
    Promise.all([
      petApi.get(petId),
      token ? adoptionApi.check(petId).catch(() => ({ data: { has_applied: false, application: null } })) : Promise.resolve({ data: { has_applied: false, application: null } }),
    ])
      .then(([petRes, checkRes]) => {
        setPet(petRes.data);
        if (checkRes.data.has_applied) {
          setMyApplication(checkRes.data.application);
        }
      })
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [id, token]);

  const handleCloudAdopt = () => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
  };

  if (loading) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  if (!pet) return null;

  const statusColor =
    pet.status === "available" ? "success" :
    pet.status === "pending" ? "warning" :
    pet.status === "adopted" ? "secondary" :
    "destructive";

  return (
    <div className="max-w-[800px] mx-auto">
      <Button variant="ghost" onClick={() => navigate(-1)} className="text-[#78716c] hover:text-[#ef4444]">
        ← 返回
      </Button>
      {pet.cover_image ? (
        <img
          src={pet.cover_image}
          alt={pet.name}
          className="w-full h-[360px] object-cover rounded-[12px] mt-4"
        />
      ) : (
        <div className="w-full h-[360px] rounded-[12px] bg-[#fef3c7] flex items-center justify-center text-[100px] mt-4">
          🐾
        </div>
      )}
      <h1 className="text-[28px] mt-4 mb-4 font-semibold">{pet.name}</h1>
      <div className="text-[13px] text-[#78716c] mb-1 flex items-center gap-2">
        <span>{SPECIES_MAP[pet.species] || SPECIES_MAP["default"]} {pet.breed}</span>
        <span>{pet.age}个月</span>
        <span>{GENDER_MAP[pet.gender] || pet.gender}</span>
        <Badge variant={statusColor as any}>{STATUS_MAP[pet.status] || pet.status}</Badge>
      </div>
      {pet.color && <p className="text-[15px] text-[#292524]">毛色：{pet.color}</p>}
      <p className="text-[#292524] leading-relaxed mt-2">{pet.description}</p>
      {pet.health_status && <p className="text-[15px] text-[#292524]">健康状况：{pet.health_status}</p>}
      <div className="flex flex-wrap gap-2 mb-6 mt-2">
        {pet.is_vaccinated && <Badge variant="success">已疫苗</Badge>}
        {pet.is_neutered && <Badge variant="info">已绝育</Badge>}
      </div>
      {(pet.city || pet.district) && (
        <p className="text-[12px] text-[#d97706]">📍 {pet.city} {pet.district}</p>
      )}
      {/* 领养申请状态提示 */}
      {myApplication && (
        <div className="mt-6 p-4 rounded-lg border border-[#e7e5e4] bg-[#fafaf9]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[14px] text-[#78716c]">我的领养申请：</span>
            <Badge variant={ADOPTION_STATUS_MAP[myApplication.status]?.color as any}>
              {ADOPTION_STATUS_MAP[myApplication.status]?.label || myApplication.status}
            </Badge>
          </div>
          <p className="text-[13px] text-[#78716c]">
            {myApplication.status === "pending"
              ? "您的申请正在审核中，请耐心等待救助站联系您。"
              : myApplication.status === "approved"
              ? "恭喜！您的领养申请已通过，救助站会尽快联系您。"
              : myApplication.status === "rejected"
              ? "很遗憾，您的领养申请未被通过。"
              : myApplication.status === "completed"
              ? "领养流程已完成，感谢您给小动物一个温暖的家！"
              : "申请已取消。"}
          </p>
          {myApplication.reply && (
            <p className="text-[13px] text-[#292524] mt-1 bg-[#fef3c7] p-2 rounded">
              💬 回复：{myApplication.reply}
            </p>
          )}
          <Button
            variant="ghost"
            className="mt-2 text-[#d97706] p-0 h-auto"
            onClick={() => navigate("/my-applications")}
          >
            查看详情 →
          </Button>
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <Button onClick={handleCloudAdopt}>我要云养</Button>
        <Button
          variant="outline"
          disabled={!!myApplication || pet.status !== "available"}
          className="text-[#d97706] border-[#f59e0b] hover:bg-[#fef3c7] disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={() => {
            if (!token) {
              navigate("/login", { replace: true });
              return;
            }
            if (pet.status !== "available") {
              toast.error("该宠物暂不可领养");
              return;
            }
            navigate(`/pet/${pet.id}/adopt`);
          }}
        >
          {myApplication ? "已申请" : "申请领养"}
        </Button>
      </div>
    </div>
  );
}
