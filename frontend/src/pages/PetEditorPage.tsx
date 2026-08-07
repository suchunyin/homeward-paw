import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "../stores/authStore";
import { petApi, uploadApi } from "../api/index";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { Card, CardContent } from "../components/ui/card";
import ImageUploader from "../components/ImageUploader";
import { Separator } from "../components/ui/separator";

const SPECIES = ["狗", "猫", "其它"];
const GENDERS = [
  { value: "male", label: "公" },
  { value: "female", label: "母" },
  { value: "unknown", label: "未知" },
];
const SIZES = [
  { value: "small", label: "小型" },
  { value: "medium", label: "中型" },
  { value: "large", label: "大型" },
];

export default function PetEditorPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("狗");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [gender, setGender] = useState("unknown");
  const [size, setSize] = useState("medium");
  const [color, setColor] = useState("");
  const [description, setDescription] = useState("");
  const [healthStatus, setHealthStatus] = useState("");
  const [isVaccinated, setIsVaccinated] = useState(false);
  const [isNeutered, setIsNeutered] = useState(false);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [status, setStatus] = useState("available");

  const [uploadingImg, setUploadingImg] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) { toast.error("请选择图片文件"); return; }
    setUploadingImg(true);
    try {
      const res = await uploadApi.upload(file);
      setImages((prev) => [...prev, res.data.url]);
    } catch {
      toast.error("图片上传失败");
    } finally {
      setUploadingImg(false);
    }
  };

  useEffect(() => {
    if (!isEdit) return;
    (async () => {
      setLoading(true);
      try {
        const res = await petApi.manageGet(Number(id));
        const p = res.data;
        setName(p.name);
        setSpecies(p.species);
        setBreed(p.breed || "");
        setAge(p.age || "");
        setGender(p.gender);
        setSize(p.size);
        setColor(p.color || "");
        setDescription(p.description || "");
        setHealthStatus(p.health_status || "");
        setIsVaccinated(p.is_vaccinated);
        setIsNeutered(p.is_neutered);
        setCity(p.city || "");
        setDistrict(p.district || "");
        setCoverImage(p.cover_image || "");
        setImages(JSON.parse(p.images || "[]"));
        setStatus(p.status);
      } catch {
        toast.error("加载宠物信息失败");
        navigate("/admin/pets");
      } finally {
        setLoading(false);
      }
    })();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("请填写宠物名称");
      return;
    }
    setSaving(true);
    try {
      const data: Record<string, unknown> = {
        name: name.trim(),
        species,
        breed,
        age: age === "" ? 0 : Number(age),
        gender,
        size,
        color,
        description,
        health_status: healthStatus,
        is_vaccinated: isVaccinated,
        is_neutered: isNeutered,
        city,
        district,
        cover_image: coverImage,
        images: JSON.stringify(images),
        status,
      };
      if (isEdit) {
        await petApi.manageUpdate(Number(id), data);
      } else {
        await petApi.create(data);
      }
      navigate("/admin/pets");
    } catch {
      toast.error(isEdit ? "更新失败" : "发布失败");
    } finally {
      setSaving(false);
    }
  };

  if (!user || (user.role !== "admin" && user.role !== "shelter")) return null;
  if (loading) return <p className="text-center py-[60px] text-[#78716c]">加载中...</p>;

  return (
    <div className="max-w-[800px] mx-auto">
      <h1 className="text-[24px] font-semibold mb-6">
        {isEdit ? "编辑领养信息" : "发布领养"}
      </h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-8 space-y-6">
        {/* 封面图 */}
        <div>
          <Label className="text-[14px] font-medium mb-2 block">封面图片</Label>
          <ImageUploader
            value={coverImage}
            onChange={(url) => setCoverImage(url)}
          />
        </div>

        {/* 基本信息 */}
        <div>
          <Label className="text-[14px] font-medium mb-3 block">基本信息</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">宠物名称 *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="如：小白" className="h-10" />
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">物种</Label>
              <Select value={species} onValueChange={setSpecies}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPECIES.map((s) => (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">品种</Label>
              <Input value={breed} onChange={(e) => setBreed(e.target.value)} placeholder="如：金毛" className="h-10" />
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">年龄（岁）</Label>
              <Input type="number" min={0} value={age} onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))} placeholder="0" className="h-10" />
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">性别</Label>
              <Select value={gender} onValueChange={setGender}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {GENDERS.map((g) => (<SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">体型</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">毛色</Label>
              <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="如：白色" className="h-10" />
            </div>
            {isEdit && (
              <div>
                <Label className="text-[13px] text-[#78716c] mb-1.5 block">状态</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">可领养</SelectItem>
                    <SelectItem value="adopted">已领养</SelectItem>
                    <SelectItem value="disabled">已暂停</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* 位置信息 */}
        <div>
          <Label className="text-[14px] font-medium mb-3 block">位置信息</Label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">所在城市</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="如：深圳" className="h-10" />
            </div>
            <div>
              <Label className="text-[13px] text-[#78716c] mb-1.5 block">所在区域</Label>
              <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="如：南山区" className="h-10" />
            </div>
          </div>
        </div>

        <Separator />

        {/* 健康状况 */}
        <div>
          <Label className="text-[14px] font-medium mb-3 block">健康状况</Label>
          <div>
            <Label className="text-[13px] text-[#78716c] mb-1.5 block">健康描述</Label>
            <Textarea value={healthStatus} onChange={(e) => setHealthStatus(e.target.value)} placeholder="如：身体健康，已驱虫..." rows={2} className="resize-none" />
          </div>
          <div className="flex items-center gap-6 mt-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={isVaccinated} onCheckedChange={(v) => setIsVaccinated(!!v)} />
              <span className="text-[13px]">已接种疫苗</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox checked={isNeutered} onCheckedChange={(v) => setIsNeutered(!!v)} />
              <span className="text-[13px]">已绝育</span>
            </label>
          </div>
        </div>

        <Separator />

        {/* 描述 */}
        <div>
          <Label className="text-[14px] font-medium mb-2 block">详细描述</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="描述宠物的性格、习惯、领养要求等..." rows={4} className="resize-none" />
        </div>

        {/* 更多图片 */}
        <div>
          <Label className="text-[14px] font-medium mb-2 block">更多图片</Label>
          <div className="grid grid-cols-3 gap-3">
            {images.map((url, i) => (
              <div key={i} className="relative rounded-lg border border-[#e7e5e4] overflow-hidden bg-white group">
                <img src={url} alt={`图片 ${i + 1}`} className="w-full h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setImages(images.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  ✕
                </button>
              </div>
            ))}
            <div
              className="h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center gap-1 cursor-pointer text-[#78716c] text-[13px] transition-colors border-[#d6d3d1] hover:border-[#f59e0b] hover:bg-[#fffbeb]"
              onClick={() => imgInputRef.current?.click()}
            >
              {uploadingImg ? (
                <span>上传中...</span>
              ) : (
                <>
                  <svg className="w-6 h-6 text-[#d6d3d1]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                  </svg>
                  <span>添加图片</span>
                </>
              )}
            </div>
          </div>
          <input
            ref={imgInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={() => navigate("/admin/pets")}>
            取消
          </Button>
          <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
            {saving ? "保存中..." : isEdit ? "保存修改" : "发布领养"}
          </Button>
        </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
