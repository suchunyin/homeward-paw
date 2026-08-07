import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { petApi } from "../api";
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    petApi.get(Number(id))
      .then((res) => setPet(res.data))
      .catch(() => navigate("/", { replace: true }))
      .finally(() => setLoading(false));
  }, [id]);

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
      <div className="mt-4 flex gap-3">
        <Button onClick={handleCloudAdopt}>我要云养</Button>
        <Button variant="outline" className="text-[#d97706] border-[#f59e0b] hover:bg-[#fef3c7]">
          申请领养
        </Button>
      </div>
    </div>
  );
}
