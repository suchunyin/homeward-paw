import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import ImageUploader from "../components/ImageUploader";

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  return iso.substring(0, 16); // "2026-08-06T14:00"
}

function toISO(local: string) {
  if (!local) return "";
  return new Date(local).toISOString();
}

export default function ActivityEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [location, setLocation] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState(20);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user && user.role !== "admin" && user.role !== "shelter") {
      navigate("/", { replace: true });
      return;
    }
    if (isEdit && id) {
      setLoading(true);
      activityApi
        .manageGet(Number(id))
        .then((res) => {
          const d = res.data;
          setTitle(d.title);
          setDescription(d.description || "");
          setCoverImage(d.cover_image || "");
          setLocation(d.location || "");
          setStartTime(toLocalDatetime(d.start_time));
          setEndTime(toLocalDatetime(d.end_time));
          setMaxParticipants(d.max_participants);
        })
        .catch(() => setError("加载活动失败"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startTime || !endTime) {
      setError("标题、开始/结束时间为必填");
      return;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setError("结束时间必须在开始时间之后");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        cover_image: coverImage.trim(),
        location: location.trim(),
        start_time: toISO(startTime),
        end_time: toISO(endTime),
        max_participants: maxParticipants,
      };
      if (isEdit && id) {
        await activityApi.update(Number(id), data);
      } else {
        await activityApi.create(data as any);
      }
      navigate("/admin/activities");
    } catch (err: any) {
      setError(err.response?.data?.detail || "保存失败");
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "shelter")) return null;
  if (loading) return <p className="text-center py-[60px] text-[#78716c] text-[15px]">加载中...</p>;

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-[24px] mb-6">{isEdit ? "编辑活动" : "发布活动"}</h1>

      {error && (
        <div className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-[12px] border border-[#e7e5e4]"
      >
        <input
          className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="活动标题"
          maxLength={100}
        />

        <div className="grid grid-cols-2 gap-4 mt-4 max-sm:grid-cols-1">
          <div className="form-group">
            <label className="block text-[14px] text-[#78716c] mb-1">开始时间</label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
            />
          </div>
          <div className="form-group">
            <label className="block text-[14px] text-[#78716c] mb-1">结束时间</label>
            <input
              type="datetime-local"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mt-4 max-sm:grid-cols-1">
          <div className="form-group">
            <label className="block text-[14px] text-[#78716c] mb-1">活动地点</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="如：XX市XX区XX公园"
              className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
            />
          </div>
          <div className="form-group">
            <label className="block text-[14px] text-[#78716c] mb-1">最大报名人数</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(Number(e.target.value) || 0)}
              min="1"
              max="9999"
              className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b]"
            />
          </div>
        </div>

        <div className="mt-4">
          <ImageUploader value={coverImage} onChange={setCoverImage} />
        </div>

        <div className="form-group mt-4">
          <label className="block text-[14px] text-[#78716c] mb-1">活动详情描述</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="活动详情描述..."
            rows={8}
            className="block w-full px-3.5 py-2.5 border border-[#e7e5e4] rounded-[8px] text-[15px] outline-none transition-colors duration-200 focus:border-[#f59e0b] resize-y"
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() => navigate("/admin/activities")}
            className="px-4 py-2 border border-[#e7e5e4] bg-white rounded-[8px] text-[14px] cursor-pointer hover:bg-[#fafaf9]"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center px-6 py-2.5 border-none rounded-[8px] text-[14px] font-semibold cursor-pointer transition-all duration-200 no-underline bg-[#f59e0b] text-white hover:bg-[#d97706] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "保存中..." : isEdit ? "保存修改" : "发布活动"}
          </button>
        </div>
      </form>
    </div>
  );
}
