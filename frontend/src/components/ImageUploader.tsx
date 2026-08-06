import { useState, useRef } from "react";
import { uploadApi } from "../api";

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  placeholder = "点击或拖拽上传封面图片",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("请选择图片文件");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("图片大小不能超过 5MB");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const res = await uploadApi.upload(file);
      onChange(res.data.url);
    } catch {
      setError("上传失败，请重试");
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => inputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="mb-4">
      <label className="block text-[14px] text-[#78716c] mb-1">封面图片</label>

      {value ? (
        <div className="rounded-[12px] border border-[#e7e5e4] overflow-hidden">
          <img src={value} alt="封面预览" className="w-full max-h-[200px] object-cover" />
          <div className="flex gap-2 p-3 bg-[#fafaf9]">
            <button
              type="button"
              onClick={handleClick}
              disabled={uploading}
              className="px-3 py-1.5 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "上传中..." : "更换图片"}
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              disabled={uploading}
              className="px-3 py-1.5 border border-[#ef4444] bg-white text-[#ef4444] rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fef2f2] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              删除
            </button>
          </div>
        </div>
      ) : (
        <div
          className="h-[160px] border-2 border-dashed border-[#e7e5e4] rounded-[12px] flex items-center justify-center cursor-pointer text-[#78716c] text-[14px] transition-colors duration-200 hover:border-[#f59e0b] hover:bg-[#fffbeb]"
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? <span>上传中...</span> : <span>{placeholder}</span>}
        </div>
      )}

      {error && (
        <p className="text-[#ef4444] text-[13px] mt-2">{error}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
