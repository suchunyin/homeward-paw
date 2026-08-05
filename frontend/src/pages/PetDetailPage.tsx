import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adoptionApi, cloudApi, donationApi, healthApi, petApi } from "../api";

interface Pet {
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
  status: string;
  owner_id: number;
  created_at: string;
}

export default function PetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pet, setPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");

  // 健康档案
  const [healthRecords, setHealthRecords] = useState<any[]>([]);
  const [showHealthTab, setShowHealthTab] = useState(false);

  // 云养宠
  const [cloudMsg, setCloudMsg] = useState("");
  const [cloudAmount, setCloudAmount] = useState(0);
  const [cloudSubmitting, setCloudSubmitting] = useState(false);
  const [cloudResult, setCloudResult] = useState("");

  // 捐赠
  const [donationMsg, setDonationMsg] = useState("");
  const [donationAmount, setDonationAmount] = useState(0);
  const [donationSubmitting, setDonationSubmitting] = useState(false);
  const [donationResult, setDonationResult] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (!id) return;
    petApi.detail(Number(id)).then((res) => setPet(res.data)).catch(() => navigate("/"));
    healthApi.listByPet(Number(id), { page_size: 20 }).then((res) => setHealthRecords(res.data.items)).catch(() => {});
  }, [id]);

  const handleApply = async () => {
    if (!token) { navigate("/login"); return; }
    if (!message.trim()) { setApplyMsg("请填写申请留言"); return; }
    setSubmitting(true);
    try {
      await adoptionApi.create({ pet_id: pet!.id, message });
      setApplyMsg("申请已提交，请等待救助站审核~");
      setMessage("");
    } catch (err: any) {
      setApplyMsg(err.response?.data?.detail || "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloudAdopt = async () => {
    if (!token) { navigate("/login"); return; }
    if (!cloudAmount || cloudAmount <= 0) { setCloudResult("请输入每月赞助金额"); return; }
    setCloudSubmitting(true);
    try {
      await cloudApi.start({ pet_id: pet!.id, monthly_amount: cloudAmount, message: cloudMsg });
      setCloudResult("云养成功！感谢你的爱心~");
      setCloudAmount(0);
      setCloudMsg("");
    } catch (err: any) {
      setCloudResult(err.response?.data?.detail || "云养失败");
    } finally {
      setCloudSubmitting(false);
    }
  };

  const handleDonate = async () => {
    if (!token) { navigate("/login"); return; }
    if (!donationAmount || donationAmount <= 0) { setDonationResult("请输入捐赠金额"); return; }
    setDonationSubmitting(true);
    try {
      await donationApi.create({
        pet_id: pet!.id,
        donation_type: "cash",
        amount: donationAmount,
        message: donationMsg,
        is_anonymous: false,
      });
      setDonationResult("捐赠已提交，感谢你的爱心！");
      setDonationAmount(0);
      setDonationMsg("");
    } catch (err: any) {
      setDonationResult(err.response?.data?.detail || "捐赠失败");
    } finally {
      setDonationSubmitting(false);
    }
  };

  const RECORD_TYPE_LABEL: Record<string, string> = {
    vaccine: "💉 疫苗",
    deworming: "🐛 驱虫",
    checkup: "🩺 体检",
    medical: "🏥 治疗",
  };

  if (!pet) return <p className="loading-text">加载中...</p>;

  return (
    <div className="pet-detail-page">
      <div className="pet-detail-hero">
        {pet.cover_image ? (
          <img src={pet.cover_image} alt={pet.name} />
        ) : (
          <div className="img-placeholder large">
            {pet.species === "猫" ? "🐱" : "🐶"}
          </div>
        )}
      </div>

      <div className="pet-detail-info">
        <h1>{pet.name}</h1>
        <div className="pet-tags">
          <span>{pet.species}</span>
          {pet.breed && <span>{pet.breed}</span>}
          <span>{pet.age}个月</span>
          <span>{pet.gender === "male" ? "公" : pet.gender === "female" ? "母" : "未知"}</span>
          <span>{pet.size === "small" ? "小型" : pet.size === "medium" ? "中型" : "大型"}</span>
        </div>

        <div className="pet-section">
          <h3>所在地</h3>
          <p>{pet.city} {pet.district}</p>
        </div>

        <div className="pet-section">
          <h3>健康状况</h3>
          <p>{pet.health_status || "暂无信息"}</p>
          <div className="health-badges">
            <span className={pet.is_vaccinated ? "badge-green" : "badge-gray"}>
              {pet.is_vaccinated ? "✅ 已疫苗" : "❌ 未疫苗"}
            </span>
            <span className={pet.is_neutered ? "badge-green" : "badge-gray"}>
              {pet.is_neutered ? "✅ 已绝育" : "❌ 未绝育"}
            </span>
          </div>
        </div>

        <div className="pet-section">
          <h3>简介</h3>
          <p>{pet.description || "暂无简介"}</p>
        </div>

        {/* 领养申请 */}
        {pet.status === "available" && (
          <div className="adoption-form">
            <h3>申请领养</h3>
            <textarea
              placeholder="请简单介绍你的养宠经验、居住环境等..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="btn btn-primary btn-block"
              onClick={handleApply}
              disabled={submitting}
            >
              {submitting ? "提交中..." : "提交领养申请"}
            </button>
            {applyMsg && <p className="apply-msg">{applyMsg}</p>}
          </div>
        )}

        {/* 云养宠 */}
        <div className="adoption-form" style={{ borderTop: "1px solid #eee", marginTop: 20, paddingTop: 16 }}>
          <h3>☁️ 云养此宠物</h3>
          <input
            type="number"
            placeholder="每月赞助金额（元）"
            value={cloudAmount || ""}
            onChange={(e) => setCloudAmount(Number(e.target.value))}
            style={{ marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="寄语（选填）"
            value={cloudMsg}
            onChange={(e) => setCloudMsg(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button
            className="btn btn-primary btn-block"
            onClick={handleCloudAdopt}
            disabled={cloudSubmitting}
          >
            {cloudSubmitting ? "提交中..." : "开始云养"}
          </button>
          {cloudResult && <p className="apply-msg">{cloudResult}</p>}
        </div>

        {/* 捐赠 */}
        <div className="adoption-form" style={{ borderTop: "1px solid #eee", marginTop: 20, paddingTop: 16 }}>
          <h3>❤️ 爱心捐赠</h3>
          <input
            type="number"
            placeholder="捐赠金额（元）"
            value={donationAmount || ""}
            onChange={(e) => setDonationAmount(Number(e.target.value))}
            style={{ marginBottom: 8 }}
          />
          <input
            type="text"
            placeholder="留言（选填）"
            value={donationMsg}
            onChange={(e) => setDonationMsg(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <button
            className="btn btn-primary btn-block"
            onClick={handleDonate}
            disabled={donationSubmitting}
          >
            {donationSubmitting ? "提交中..." : "立即捐赠"}
          </button>
          {donationResult && <p className="apply-msg">{donationResult}</p>}
        </div>

        {/* 健康档案 */}
        {healthRecords.length > 0 && (
          <div className="pet-section" style={{ marginTop: 20, borderTop: "1px solid #eee", paddingTop: 16 }}>
            <h3>📋 健康档案</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {healthRecords.map((r) => (
                <div key={r.id} style={{
                  background: "#fafaf5", borderRadius: 12, padding: "12px 16px",
                  borderLeft: "4px solid #f59e0b"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <strong>{RECORD_TYPE_LABEL[r.record_type] || r.record_type}</strong>
                    <span style={{ fontSize: 13, color: "#999" }}>
                      {new Date(r.record_date).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, margin: "4px 0 0", color: "#555" }}>
                    {r.title}
                    {r.vet_name && ` · ${r.vet_name}`}
                    {r.vet_clinic && ` @ ${r.vet_clinic}`}
                  </p>
                  {r.description && <p style={{ fontSize: 13, color: "#78716c", marginTop: 4 }}>{r.description}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
