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
      <div className="text-center pt-8 pb-6">
        <h1 className="text-[36px] text-[#292524] mb-2">爱心捐赠公示</h1>
        <p className="text-[#78716c] mb-8">每一份善意都值得被看见，感谢每一位伸出援手的你</p>
      </div>

      {loading ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</div>
      ) : donations.length === 0 ? (
        <div className="text-center py-[60px] text-[#78716c] text-[15px]">暂无捐赠记录</div>
      ) : (
        <div>
          <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {donations.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-[12px] overflow-hidden no-underline text-[#292524] shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,0,0,0.1)] block"
              >
                <div
                  className="h-[120px] overflow-hidden flex items-center justify-center"
                  style={{ background: d.donation_type === "cash" ? "#fef3c7" : "#dbeafe" }}
                >
                  <div style={{ fontSize: 36 }}>{d.donation_type === "cash" ? "💰" : "📦"}</div>
                </div>
                <div className="p-4">
                  <h3 className="text-[17px] mb-1">
                    {d.is_anonymous
                      ? "匿名爱心人士"
                      : `用户 #${d.user_id}`}
                  </h3>
                  <p className="text-[13px] text-[#78716c] mb-1">
                    {d.donation_type === "cash"
                      ? `捐赠 ¥${d.amount}`
                      : `捐赠 ${d.goods_name} ×${d.goods_quantity}`}
                  </p>
                  {d.message && (
                    <p className="text-[13px] text-[#78716c] mb-1 mt-1">
                      💌 "{d.message}"
                    </p>
                  )}
                  {d.pet_id && (
                    <p className="text-[12px] text-[#d97706]">指定宠物 #{d.pet_id}</p>
                  )}
                  <p className="text-[12px] text-[#78716c] mt-1">
                    {new Date(d.created_at).toLocaleDateString()} · {d.is_verified ? "✅ 已确认" : "⏳ 待确认"}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              <span className="text-[14px] text-[#78716c]">{page} / {totalPages}</span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-5 py-2 border border-[#e7e5e4] bg-white rounded-[8px] cursor-pointer text-[14px] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
