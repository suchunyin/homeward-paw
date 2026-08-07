import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
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

import { knowledgeApi, uploadApi } from "../api";
import { useAuthStore } from "../stores/authStore";

const CATEGORIES = [
  { value: "care", label: "宠物护理" },
  { value: "medical", label: "急救知识" },
  { value: "law", label: "法规科普" },
  { value: "story", label: "救助故事" },
];

const QUILL_MODULES = {
  toolbar: {
    container: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ color: [] }, { background: [] }],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link", "image", "blockquote"],
      ["clean"],
    ],
    handlers: {},
  },
};

const QUILL_FORMATS = [
  "header", "bold", "italic", "underline", "strike",
  "color", "background", "list", "bullet",
  "link", "image", "blockquote",
];

export default function KnowledgeEditorPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const quillRef = useRef<any>(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("care");
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [coverImage, setCoverImage] = useState("");
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
      knowledgeApi
        .manageGet(Number(id))
        .then((res) => {
          const d = res.data;
          setTitle(d.title);
          setCategory(d.category);
          setContent(d.content);
          setSummary(d.summary || "");
          setCoverImage(d.cover_image || "");
        })
        .catch(() => setError("加载文章失败"))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit, user, navigate]);

  // 自定义图片上传 handler
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const toolbar = quill.getEditor().getModule("toolbar") as { handlers: Record<string, () => void> };
    toolbar.handlers["image"] = () => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const res = await uploadApi.upload(file);
          const url = res.data.url;
          const editor = quill.getEditor();
          const range = editor.getSelection(true);
          editor.insertEmbed(range.index, "image", url);
        } catch {
          alert("图片上传失败");
        }
      };
      input.click();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const data = {
        title: title.trim(),
        category,
        content,
        summary: summary.trim(),
        cover_image: coverImage.trim(),
      };
      if (isEdit && id) {
        await knowledgeApi.update(Number(id), data);
      } else {
        await knowledgeApi.create(data);
      }
      navigate("/admin/knowledge");
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
      <h1 className="text-[24px] mb-6 font-semibold">{isEdit ? "编辑文章" : "写文章"}</h1>

      {error && (
        <div className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="title">文章标题</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="文章标题"
                  maxLength={100}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">分类</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger id="category" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ImageUploader value={coverImage} onChange={setCoverImage} />

            <div className="space-y-2">
              <Label htmlFor="summary">文章摘要（选填）</Label>
              <Textarea
                id="summary"
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                placeholder="文章摘要（选填）"
                rows={2}
                maxLength={200}
              />
            </div>

            <div className="pt-2">
              <ReactQuill
                ref={quillRef}
                value={content}
                onChange={(val: string) => setContent(val)}
                modules={QUILL_MODULES}
                formats={QUILL_FORMATS}
                placeholder="开始撰写文章内容..."
                style={{ height: "400px", marginBottom: "50px" }}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/knowledge")}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
                {saving ? "保存中..." : "保存"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
