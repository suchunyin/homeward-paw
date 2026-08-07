import { useState, useRef } from "react";
import { uploadApi } from "../api";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

interface ImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  placeholder?: string;
}

export default function ImageUploader({
  value,
  onChange,
  placeholder = "点击或拖拽上传封面图片（支持 JPG / PNG / WebP，最大 5MB）",
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // 校验文件类型（MIME + 扩展名双重校验）
    const ext = "." + file.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) || !ALLOWED_EXTENSIONS.includes(ext)) {
      return "仅支持 JPG、PNG、WebP 格式的图片";
    }
    if (file.size > MAX_SIZE) {
      return `图片大小不能超过 5MB（当前 ${(file.size / 1024 / 1024).toFixed(1)}MB）`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const err = validateFile(file);
    if (err) {
      setError(err);
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
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  /* 判断是否为本地已上传路径 */
  const isLocalPath = value.startsWith("/uploads/");

  return (
    <div className="mb-4">
      <label className="block text-[14px] font-medium text-[#292524] mb-2">封面图片</label>

      {value ? (
        <div className="rounded-[12px] border border-[#e7e5e4] overflow-hidden bg-white">
          {/* 图片预览（缩略图） */}
          <div className="relative bg-[#fafaf9] flex items-center justify-center">
            <img
              src={value}
              alt="封面预览"
              className="w-full max-h-[220px] object-contain"
            />
          </div>

          {/* 图片路径信息 + 操作按钮 */}
          <div className="p-3 bg-[#fafaf9] border-t border-[#e7e5e4]">
            <div className="flex items-center gap-2 mb-2.5">
              <span className="text-[12px] text-[#78716c]">
                {isLocalPath ? "本地文件" : "远程链接"}
              </span>
              <input
                type="text"
                readOnly
                value={value}
                className="flex-1 min-w-0 px-2.5 py-1 bg-white border border-[#e7e5e4] rounded-[6px] text-[12px] text-[#78716c] outline-none select-all"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleClick}
                disabled={uploading}
                className="px-3 py-1.5 border border-[#e7e5e4] bg-white rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fafaf9] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? "上传中..." : "更换图片"}
              </button>
              <button
                type="button"
                onClick={() => onChange("")}
                disabled={uploading}
                className="px-3 py-1.5 border border-[#ef4444] bg-white text-[#ef4444] rounded-[6px] text-[13px] cursor-pointer hover:bg-[#fef2f2] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`h-[180px] border-2 border-dashed rounded-[12px] flex flex-col items-center justify-center gap-2 cursor-pointer text-[#78716c] text-[14px] transition-colors duration-200 ${
            dragOver
              ? "border-[#f59e0b] bg-[#fffbeb]"
              : "border-[#d6d3d1] hover:border-[#f59e0b] hover:bg-[#fffbeb]"
          }`}
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {uploading ? (
            <>
              <svg className="animate-spin w-6 h-6 text-[#f59e0b]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>正在上传...</span>
            </>
          ) : (
            <>
              <svg
                className="w-8 h-8 text-[#d6d3d1]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0L21 15M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                />
              </svg>
              <span className="text-center leading-relaxed">{placeholder}</span>
            </>
          )}
        </div>
      )}

      {/* 错误提示 */}
      {error && (
        <p className="text-[#ef4444] text-[13px] mt-2 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
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
