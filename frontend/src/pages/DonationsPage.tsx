import { useEffect, useState } from "react";
import { donationApi } from "../api";

const TYPE_MAP: Record<string, string> = {
  cash: "💰 现金",
  goods: "📦 物资",
};

export default function DonationsPage() {
  const [donations, setDonations] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const pageSize = 12;

  useEffect(() => {
    setLoading(true);
    donationApi
      .list({ page, page_size: pageSize })
      .then((res) => {
        setDonations(res.data.items);
        setTotal(res.data.total);
      })
      .finally(() => setLoading(false));
  }, [page]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div>
      <div className="hero" style={{ padding: "32px 0 24px" }}>
        <h1>爱心捐赠公示</h1>
        <p>每一份善意都值得被看见，感谢每一位伸出援手的你</p>
      </div>

      {loading ? (
        <div className="loading-text">加载中...</div>
      ) : donations.length === 0 ? (
        <div className="empty-text">暂无捐赠记录</div>
      ) : (
        <div>
          <div className="pet-grid">
            {donations.map((d) => (
              <div key={d.id} className="pet-card" style={{ display: "block" }}>
                <div
                  className="pet-card-img"
                  style={{
                    height: 120,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: d.donation_type === "cash" ? "#fef3c7" : "#dbeafe",
                  }}
                >
                  <div style={{ fontSize: 36 }}>{d.donation_type === "cash" ? "💰" : "📦"}</div>
                </div>
                <div className="pet-card-info">
                  <h3>
                    {d.is_anonymous
                      ? "匿名爱心人士"
                      : `用户 #${d.user_id}`}
                  </h3>
                  <p className="pet-meta">
                    {d.donation_type === "cash"
                      ? `捐赠 ¥${d.amount}`
                      : `捐赠 ${d.goods_name} ×${d.goods_quantity}`}
                  </p>
                  {d.message && (
                    <p className="pet-meta" style={{ marginTop: 4 }}>
                      💌 "{d.message}"
                    </p>
                  )}
                  {d.pet_id && (
                    <p className="pet-location">指定宠物 #{d.pet_id}</p>
                  )}
                  <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
                    {new Date(d.created_at).toLocaleDateString()} · {d.is_verified ? "✅ 已确认" : "⏳ 待确认"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</button>
              <span>{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>下一页</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
