import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format, parseISO, isValid } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { activityApi } from "../api";
import { useAuthStore } from "../stores/authStore";
import ImageUploader from "../components/ImageUploader";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Card, CardContent } from "../components/ui/card";
import { Calendar } from "../components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

function toLocalDatetime(iso: string) {
  if (!iso) return "";
  return iso.substring(0, 16); // "2026-08-06T14:00"
}

function toISO(local: string) {
  if (!local) return "";
  return new Date(local).toISOString();
}

function getDateObject(datetime: string): Date | undefined {
  if (!datetime) return undefined;
  const d = parseISO(datetime);
  return isValid(d) ? d : undefined;
}

function getTimeString(datetime: string): string {
  if (!datetime) return "";
  const m = datetime.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : "";
}

function updateDatePart(datetime: string, date: Date): string {
  const d = format(date, "yyyy-MM-dd");
  const t = getTimeString(datetime) || "00:00";
  return `${d}T${t}`;
}

function updateTimePart(datetime: string, time: string): string {
  const d = datetime ? format(parseISO(datetime), "yyyy-MM-dd") : format(new Date(), "yyyy-MM-dd");
  return `${d}T${time}`;
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
      <h1 className="text-[24px] mb-6 font-semibold">{isEdit ? "编辑活动" : "发布活动"}</h1>

      {error && (
        <div className="bg-[#fef2f2] text-[#ef4444] px-4 py-2.5 rounded-[8px] mb-4 text-[14px]">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardContent className="p-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">活动标题</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="活动标题"
                maxLength={100}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="space-y-2">
                <Label>开始时间</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {startTime ? format(parseISO(startTime), "yyyy/MM/dd") : <span className="text-muted-foreground">选择日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={getDateObject(startTime)}
                        onSelect={(date) => {
                          if (date) setStartTime(updateDatePart(startTime, date));
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    className="w-[120px] shrink-0"
                    value={getTimeString(startTime)}
                    onChange={(e) => setStartTime(updateTimePart(startTime, e.target.value))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>结束时间</Label>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="flex-1 justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                        {endTime ? format(parseISO(endTime), "yyyy/MM/dd") : <span className="text-muted-foreground">选择日期</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={getDateObject(endTime)}
                        onSelect={(date) => {
                          if (date) setEndTime(updateDatePart(endTime, date));
                        }}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    className="w-[120px] shrink-0"
                    value={getTimeString(endTime)}
                    onChange={(e) => setEndTime(updateTimePart(endTime, e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="space-y-2">
                <Label htmlFor="location">活动地点</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="如：XX市XX区XX公园"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxParticipants">最大报名人数</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value) || 0)}
                  min="1"
                  max="9999"
                />
              </div>
            </div>

            <ImageUploader value={coverImage} onChange={setCoverImage} />

            <div className="space-y-2">
              <Label htmlFor="description">活动详情描述</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="活动详情描述..."
                rows={8}
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/admin/activities")}
              >
                取消
              </Button>
              <Button type="submit" disabled={saving} className="bg-amber-500 hover:bg-amber-600 text-white">
                {saving ? "保存中..." : isEdit ? "保存修改" : "发布活动"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}
