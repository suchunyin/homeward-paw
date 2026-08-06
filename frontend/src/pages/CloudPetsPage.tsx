import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { cloudAdoptionApi } from "../api";
import { useAuthStore } from "../stores/authStore";

interface CloudPet {
  id: number;
  pet_id: number;
  pet_name: string;
  pet_image?: string;
  adopter_name: string;
  created_at: string;
}

export default function CloudPetsPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const [pets, setPets] = useState<CloudPet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }
    cloudAdoptionApi.list()
      .then((res) => setPets(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!token) return null;

  return (
    <div>
      <h2 className="text-[24px] mb-6">云养宠</h2>
      {loading ? (
        <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>
      ) : pets.length === 0 ? (
        <p className="text-center py-[60px] text-[#78716c] text-[15px]">
          暂未云养任何宠物，去首页看看喜欢的宠物吧！
        </p>
      ) : (
        <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
          {pets.map((p) => (
            <Link
              key={p.id}
              to={`/pet/${p.pet_id}`}
              className="bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]"
            >
              <div className="h-[200px] overflow-hidden bg-[#fef3c7]">
                {p.pet_image ? (
                  <img src={p.pet_image} alt={p.pet_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[64px]">🐾</div>
                )}
              </div>
              <div className="p-4">
                <h3 className="text-[17px] mb-1">{p.pet_name}</h3>
                <p className="text-[13px] text-[#78716c]">云养人：{p.adopter_name}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
