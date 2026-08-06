import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { petApi } from "../api";
import { useAuthStore } from "../stores/authStore";

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
    // cloud adoption logic
  };

  if (loading) return <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>;
  if (!pet) return null;

  return (
    <div className="max-w-[800px] mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="bg-none border-none text-[#78716c] cursor-pointer text-[14px] hover:text-[#ef4444]"
      >
        ← 返回
      </button>
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
      <h1 className="text-[28px] mb-4 mt-4">{pet.name}</h1>
      <div className="text-[13px] text-[#78716c] mb-1 flex items-center gap-2">
        <span>{SPECIES_MAP[pet.species] || SPECIES_MAP["default"]} {pet.breed}</span>
        <span>{pet.age}个月</span>
        <span>{GENDER_MAP[pet.gender] || pet.gender}</span>
        <span
          className={
            pet.status === "available"
              ? "text-[#16a34a]"
              : pet.status === "pending"
              ? "text-[#d97706]"
              : pet.status === "adopted"
              ? "text-[#64748b]"
              : "text-[#ef4444]"
          }
        >
          {STATUS_MAP[pet.status] || pet.status}
        </span>
      </div>
      {pet.color && <p>毛色：{pet.color}</p>}
      <p className="text-[#292524] leading-relaxed">{pet.description}</p>
      {pet.health_status && <p>健康状况：{pet.health_status}</p>}
      <div className="flex flex-wrap gap-2 mb-6 mt-2">
        {pet.is_vaccinated && (
          <span className="bg-[#dcfce7] text-[#166534] px-3 py-1 rounded-[6px] text-[13px]">已疫苗</span>
        )}
        {pet.is_neutered && (
          <span className="bg-[#dbeafe] text-[#1d4ed8] px-3 py-1 rounded-[6px] text-[13px]">已绝育</span>
        )}
      </div>
      {(pet.city || pet.district) && (
        <p className="text-[12px] text-[#d97706]">📍 {pet.city} {pet.district}</p>
      )}
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleCloudAdopt}
          className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706]"
        >
          我要云养
        </button>
        <button className="inline-flex items-center justify-center px-6 py-2.5 border border-[#f59e0b] rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-white text-[#d97706] hover:bg-[#fef3c7]">
          申请领养
        </button>
      </div>
    </div>
  );
}
