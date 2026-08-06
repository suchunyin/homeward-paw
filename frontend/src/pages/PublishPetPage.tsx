import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { petApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import ImageUploader from "../components/ImageUploader";

export default function PublishPetPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("dog");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("male");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!token) {
    navigate("/login", { replace: true });
    return null;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data: Record<string, unknown> = {
        name,
        species,
        breed,
        age: age ? parseInt(age, 10) : 0,
        gender,
        description,
        cover_image: coverImage || "",
      };

      await petApi.create(data);
      navigate("/", { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || "发布失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto">
      <h2 className="text-[24px] mb-6">发布领养</h2>
      <form
        className="bg-white p-10 rounded-[12px] shadow-[0_2px_12px_rgba(0,0,0,0.06)]"
        onSubmit={handleSubmit}
      >
        {error && (
          <div className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
            {error}
          </div>
        )}
        <label className="block mb-4 text-[14px] text-[#78716c]">
          宠物名称
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          种类
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b] bg-white"
          >
            <option value="dog">狗狗</option>
            <option value="cat">猫咪</option>
            <option value="other">其他</option>
          </select>
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          品种
          <input
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          年龄（月）
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            placeholder="如：12"
            min="0"
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          />
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          性别
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b] bg-white"
          >
            <option value="male">公</option>
            <option value="female">母</option>
          </select>
        </label>
        <label className="block mb-4 text-[14px] text-[#78716c]">
          描述
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="block w-full mt-1 px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b] resize-y"
          />
        </label>
        <ImageUploader value={coverImage} onChange={setCoverImage} />
        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "发布中..." : "发布"}
        </button>
      </form>
    </div>
  );
}
