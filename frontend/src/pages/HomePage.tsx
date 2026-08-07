import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { petApi } from "../api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";

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

const PAGE_SIZE = 12;

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
      const params: Record<string, any> = { page, page_size: PAGE_SIZE };
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
          <Input
            placeholder="搜索宠物名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="flex-1 min-w-0 h-[48px] text-[15px]"
          />
          <Select value={species} onValueChange={setSpecies}>
            <SelectTrigger className="h-[48px] min-w-[130px] w-auto">
              <SelectValue placeholder="全部" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部</SelectItem>
              <SelectItem value="猫">猫</SelectItem>
              <SelectItem value="狗">狗</SelectItem>
              <SelectItem value="其他">其他</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} className="bg-amber-500 hover:bg-amber-600 text-white h-[48px] px-8 text-[14px]">
            搜索
          </Button>
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
                  className="block bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)]"
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

            {total > PAGE_SIZE && (
              <div className="flex items-center justify-center gap-4 mt-8">
                <Button
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                  size="sm"
                >
                  上一页
                </Button>
                <span className="text-[14px] text-[#78716c]">
                  第 {page} / {Math.ceil(total / PAGE_SIZE)} 页
                </span>
                <Button
                  variant="outline"
                  disabled={page >= Math.ceil(total / PAGE_SIZE)}
                  onClick={() => setPage((p) => p + 1)}
                  size="sm"
                >
                  下一页
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
