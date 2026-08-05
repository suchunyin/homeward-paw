import { type FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { petApi } from "../api";

export default function PublishPetPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    species: "狗",
    breed: "",
    age: 0,
    gender: "unknown",
    size: "medium",
    color: "",
    description: "",
    health_status: "",
    is_vaccinated: false,
    is_neutered: false,
    city: "",
    district: "",
  });

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("请输入宠物名称"); return; }
    setLoading(true);
    setError("");
    try {
      await petApi.create(form);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || "发布失败");
    } finally {
      setLoading(false);
    }
  };

  if (!localStorage.getItem("token")) {
    navigate("/login");
    return null;
  }

  return (
    <div className="publish-page">
      <form className="publish-form" onSubmit={handleSubmit}>
        <h2>发布领养信息</h2>
        {error && <p className="error-msg">{error}</p>}

        <div className="form-row">
          <label>
            宠物名称 *
            <input type="text" value={form.name} onChange={(e) => handleChange("name", e.target.value)} required />
          </label>
          <label>
            物种
            <select value={form.species} onChange={(e) => handleChange("species", e.target.value)}>
              <option value="狗">狗</option>
              <option value="猫">猫</option>
              <option value="其他">其他</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            品种
            <input type="text" value={form.breed} onChange={(e) => handleChange("breed", e.target.value)} placeholder="如：金毛、橘猫" />
          </label>
          <label>
            月龄
            <input type="number" value={form.age} onChange={(e) => handleChange("age", Number(e.target.value))} min={0} />
          </label>
        </div>

        <div className="form-row">
          <label>
            性别
            <select value={form.gender} onChange={(e) => handleChange("gender", e.target.value)}>
              <option value="male">公</option>
              <option value="female">母</option>
              <option value="unknown">未知</option>
            </select>
          </label>
          <label>
            体型
            <select value={form.size} onChange={(e) => handleChange("size", e.target.value)}>
              <option value="small">小型</option>
              <option value="medium">中型</option>
              <option value="large">大型</option>
            </select>
          </label>
        </div>

        <div className="form-row">
          <label>
            所在城市
            <input type="text" value={form.city} onChange={(e) => handleChange("city", e.target.value)} />
          </label>
          <label>
            所在区域
            <input type="text" value={form.district} onChange={(e) => handleChange("district", e.target.value)} />
          </label>
        </div>

        <label>
          颜色
          <input type="text" value={form.color} onChange={(e) => handleChange("color", e.target.value)} />
        </label>

        <label>
          健康状况
          <textarea rows={2} value={form.health_status} onChange={(e) => handleChange("health_status", e.target.value)} placeholder="疫苗接种、驱虫等信息" />
        </label>

        <div className="form-row-check">
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_vaccinated} onChange={(e) => handleChange("is_vaccinated", e.target.checked)} />
            已接种疫苗
          </label>
          <label className="checkbox-label">
            <input type="checkbox" checked={form.is_neutered} onChange={(e) => handleChange("is_neutered", e.target.checked)} />
            已绝育
          </label>
        </div>

        <label>
          简介
          <textarea rows={4} value={form.description} onChange={(e) => handleChange("description", e.target.value)} placeholder="描述宠物的性格、习惯等" />
        </label>

        <button className="btn btn-primary btn-block" disabled={loading}>
          {loading ? "发布中..." : "发布"}
        </button>
      </form>
    </div>
  );
}
