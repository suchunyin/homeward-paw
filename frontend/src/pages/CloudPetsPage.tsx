import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { cloudApi } from "../api";

export default function CloudPetsPage() {
  const [cloudPets, setCloudPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!token) return;
    cloudApi
      .myCloudPets()
      .then((res) => setCloudPets(res.data.items))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async (cloudId: number) => {
    if (!confirm("确定取消云养此宠物吗？")) return;
    await cloudApi.cancel(cloudId);
    setCloudPets((prev) => prev.filter((c) => c.id !== cloudId));
  };

  if (!token) {
    return (
      <div className="empty-text">
        <p>请先登录查看云养宠</p>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
          去登录
        </Link>
      </div>
    );
  }

  if (loading) return <div className="loading-text">加载中...</div>;

  return (
    <div>
      <div className="hero" style={{ padding: "32px 0 24px" }}>
        <h1>我的云养宠</h1>
        <p>每一份云养，都是对毛孩子的温暖守护</p>
      </div>

      {cloudPets.length === 0 ? (
        <div className="empty-text">
          <p>还没有云养任何宠物</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: "inline-flex" }}>
            去看看待领养宠物
          </Link>
        </div>
      ) : (
        <div className="pet-grid">
          {cloudPets.map((c) => (
            <div key={c.id} className="pet-card" style={{ display: "block" }}>
              <div className="pet-card-img">
                <div className="img-placeholder">🐾</div>
              </div>
              <div className="pet-card-info">
                <h3>宠物 #{c.pet_id}</h3>
                <p className="pet-meta">
                  每月赞助: <strong style={{ color: "#d97706" }}>¥{c.monthly_amount}</strong>
                </p>
                {c.message && (
                  <p className="pet-meta" style={{ marginTop: 4 }}>
                    💌 "{c.message}"
                  </p>
                )}
                <p className="pet-location">
                  开始于 {new Date(c.created_at).toLocaleDateString()}
                </p>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ marginTop: 12 }}
                  onClick={() => handleCancel(c.id)}
                >
                  取消云养
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
