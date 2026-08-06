import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { petApi } from "../api";

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  size: string;
  city: string;
  cover_image: string;
  description: string;
  status: string;
}

const SPECIES_OPTIONS = ["", "狗", "猫", "其他"];

export default function HomePage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [species, setSpecies] = useState("");
  const [keyword, setKeyword] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = { page, page_size: 12 };
      if (species) params.species = species;
      if (keyword) params.keyword = keyword;
      const res = await petApi.list(params);
      setPets(res.data.items);
      setTotal(res.data.total);
    } catch (err) {
      console.error("加载宠物列表失败", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPets();
  }, [page, species]);

  const handleSearch = () => {
    setPage(1);
    fetchPets();
  };

  return (
    <div>
      {/* 搜索栏 */}
      <section className="text-center pt-[60px] pb-[40px]">
        <h1 className="text-[36px] text-[#292524] mb-2">找到你的毛孩子</h1>
        <p className="text-[#78716c] mb-8">领养代替购买，给流浪动物一个温暖的家</p>
        <div className="flex gap-3 max-w-[600px] mx-auto max-sm:flex-col">
          <input
            type="text"
            placeholder="搜索宠物名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 px-4 py-3 border-2 border-[#e7e5e4] rounded-[12px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="px-3 py-3 border-2 border-[#e7e5e4] rounded-[12px] text-[15px] outline-none bg-white"
          >
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || "全部物种"}
              </option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            className="inline-flex items-center justify-center px-8 py-3 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706]"
          >
            搜索
          </button>
        </div>
      </section>

      {/* 宠物列表 */}
      <section className="py-6">
        {loading ? (
          <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>
        ) : pets.length === 0 ? (
          <p className="text-center py-[60px] text-[#78716c] text-[15px]">
            暂无待领养宠物，去发布一只吧~
          </p>
        ) : (
          <>
            <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
              {pets.map((pet) => (
                <Link
                  to={`/pet/${pet.id}`}
                  key={pet.id}
                  className="bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]"
                >
                  <div className="h-[200px] overflow-hidden bg-[#fef3c7]">
                    {pet.cover_image ? (
                      <img src={pet.cover_image} alt={pet.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[64px]">
                        {pet.species === "猫" ? "🐱" : "🐶"}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-[17px] mb-1">{pet.name}</h3>
                    <p className="text-[13px] text-[#78716c] mb-1">
                      {pet.breed || pet.species} · {pet.age}个月 · {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : ""}
                    </p>
                    <p className="text-[12px] text-[#d97706]">{pet.city || "未知城市"}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 分页 */}
            {total > 12 && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  上一页
                </button>
                <span className="text-[14px] text-[#78716c]">
                  第 {page} / {Math.ceil(total / 12)} 页
                </span>
                <button
                  disabled={page >= Math.ceil(total / 12)}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
