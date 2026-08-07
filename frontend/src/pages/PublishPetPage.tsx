import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { petApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import ImageUploader from "../components/ImageUploader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";

export default function PublishPetPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("cat");
  const [breed, setBreed] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("female");
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
      <h2 className="text-[24px] mb-6 font-semibold">发布领养</h2>
      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-10 pt-8 space-y-4">
            {error && (
              <div className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] text-[14px]">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">宠物名称</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="species">种类</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger id="species" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cat">猫咪</SelectItem>
                    <SelectItem value="dog">狗狗</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gender">性别</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger id="gender" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">雌</SelectItem>
                    <SelectItem value="male">雄</SelectItem>
                    <SelectItem value="unknown">未知</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="breed">品种</Label>
                <Input
                  id="breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="age">年龄（月）</Label>
                <Input
                  id="age"
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="如：12"
                  min="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <ImageUploader value={coverImage} onChange={setCoverImage} />

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white"
              size="lg"
            >
              {loading ? "发布中..." : "发布"}
            </Button>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
