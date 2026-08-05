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
    <div className="home-page">
      {/* 搜索栏 */}
      <section className="hero">
        <h1>找到你的毛孩子</h1>
        <p>领养代替购买，给流浪动物一个温暖的家</p>
        <div className="search-bar">
          <input
            type="text"
            placeholder="搜索宠物名称..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            {SPECIES_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s || "全部物种"}
              </option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleSearch}>
            搜索
          </button>
        </div>
      </section>

      {/* 宠物列表 */}
      <section className="pet-grid-section">
        {loading ? (
          <p className="loading-text">加载中...</p>
        ) : pets.length === 0 ? (
          <p className="empty-text">暂无待领养宠物，去发布一只吧~</p>
        ) : (
          <>
            <div className="pet-grid">
              {pets.map((pet) => (
                <Link to={`/pet/${pet.id}`} key={pet.id} className="pet-card">
                  <div className="pet-card-img">
                    {pet.cover_image ? (
                      <img src={pet.cover_image} alt={pet.name} />
                    ) : (
                      <div className="img-placeholder">
                        {pet.species === "猫" ? "🐱" : "🐶"}
                      </div>
                    )}
                  </div>
                  <div className="pet-card-info">
                    <h3>{pet.name}</h3>
                    <p className="pet-meta">
                      {pet.breed || pet.species} · {pet.age}个月 · {pet.gender === "male" ? "♂" : pet.gender === "female" ? "♀" : ""}
                    </p>
                    <p className="pet-location">{pet.city || "未知城市"}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* 分页 */}
            {total > 12 && (
              <div className="pagination">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  上一页
                </button>
                <span>
                  第 {page} / {Math.ceil(total / 12)} 页
                </span>
                <button
                  disabled={page >= Math.ceil(total / 12)}
                  onClick={() => setPage((p) => p + 1)}
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
