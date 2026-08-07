import axios from "axios";
import { useAuthStore } from "../stores/authStore";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
});

// 请求拦截 — 自动附加 token（从 Zustand persist store 读取）
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截 — 401 自动跳转登录
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;

// ── 用户 ──
export const userApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post("/users/register", data),
  login: (data: { account: string; password: string }) =>
    api.post("/users/login", data),
  getMe: () => api.get("/users/me"),
  getList: (params: { page?: number; page_size?: number; role?: string } = {}) =>
    api.get("/users", { params }),
};

export const adminApi = {
  listUsers: (params: { page?: number; page_size?: number; role?: string } = {}) =>
    api.get("/users", { params }),
  listRoles: () => api.get("/users/roles"),
  updateUserRole: (userId: number, role: string) =>
    api.put(`/users/${userId}/role`, { role }),
  deleteUser: (userId: number) => api.delete(`/users/${userId}`),
  getRoles: () => api.get("/users/roles"),
};

// ── 宠物 ──
export const petApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get("/pets", { params }),
  get: (id: number) => api.get(`/pets/${id}`),
  create: (data: object) => api.post("/pets", data),
  update: (id: number, data: object) => api.put(`/pets/${id}`, data),
  delete: (id: number) => api.delete(`/pets/${id}`),
  // 管理端
  manageList: (params: Record<string, unknown> = {}) =>
    api.get("/pets/manage/list", { params }),
  manageGet: (id: number) => api.get(`/pets/manage/${id}`),
  manageUpdate: (id: number, data: object) => api.put(`/pets/manage/${id}`, data),
  manageDelete: (id: number) => api.delete(`/pets/manage/${id}`),
  toggleStatus: (id: number, status: string) =>
    api.put(`/pets/manage/${id}/status`, null, { params: { status } }),
};

// ── 领养 ──

/** 养宠经历 key → 中文名称 */
export const PET_EXPERIENCE_MAP: Record<string, string> = {
  none: "从未养过",
  some: "养过但目前没有",
  current: "目前正在养",
  professional: "丰富经验",
};

/** 住房类型 key → 中文名称 */
export const HOUSING_TYPE_MAP: Record<string, string> = {
  own_house: "自有住房",
  rent_long: "长期租房（1年+）",
  rent_short: "短期租房",
  dorm: "学校宿舍",
  apartment: "公寓",
  house: "独立房屋",
  dormitory: "宿舍",
  other: "其他",
};

export interface AdoptionApplication {
  id: number;
  user_id: number;
  pet_id: number;
  status: "pending" | "approved" | "rejected" | "cancelled" | "completed";
  message: string;
  reply: string;
  real_name: string;
  phone: string;
  housing_type: string;
  has_sealed_window: boolean;
  family_agree: boolean;
  family_allergy: boolean;
  pet_experience: string;
  reason: string;
  agree_terms: boolean;
  agree_follow_up: boolean;
  created_at: string;
  updated_at: string;
  // 扩展字段（AdoptionWithPetOut）
  pet_name?: string;
  pet_breed?: string;
  pet_cover_image?: string;
  applicant_name?: string;
  applicant_phone?: string;
}

export interface AdoptionCheckResult {
  has_applied: boolean;
  application: AdoptionApplication | null;
}

export const adoptionApi = {
  create: (data: {
    pet_id: number;
    real_name: string;
    phone: string;
    housing_type: string;
    has_sealed_window: boolean;
    family_agree: boolean;
    family_allergy: boolean;
    pet_experience: string;
    reason: string;
    agree_terms: boolean;
    agree_follow_up: boolean;
    message?: string;
  }) =>
    api.post("/adoptions", data),
  list: (params: Record<string, unknown> = {}) =>
    api.get("/adoptions", { params }),
  update: (id: number, data: { status?: string; reply?: string }) =>
    api.put(`/adoptions/${id}`, data),
  // 检查是否已申请某宠物
  check: (petId: number) =>
    api.get<AdoptionCheckResult>(`/adoptions/check/${petId}`),
  // 救助站/管理员查看收到的申请
  listReceived: (params: Record<string, unknown> = {}) =>
    api.get<AdoptionApplication[]>("/adoptions/received", { params }),
};

// ── 宠物知识 ──
export const knowledgeApi = {
  list: (params: { page?: number; page_size?: number; category?: string; keyword?: string } = {}) =>
    api.get("/knowledge", { params }),
  get: (id: number) => api.get(`/knowledge/${id}`),
  getCategories: () => api.get("/knowledge/categories"),
  // 管理端
  manageList: (params: { page?: number; page_size?: number; category?: string; status?: string; keyword?: string } = {}) =>
    api.get("/knowledge/manage/list", { params }),
  manageGet: (id: number) => api.get(`/knowledge/manage/${id}`),
  create: (data: { title: string; category: string; content: string; summary?: string; cover_image?: string }) =>
    api.post("/knowledge", data),
  update: (id: number, data: object) => api.put(`/knowledge/${id}`, data),
  publishToggle: (id: number) => api.put(`/knowledge/${id}/publish`),
  delete: (id: number) => api.delete(`/knowledge/${id}`),
};

// ── 日记 ──
export const diaryApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get("/diaries", { params }),
  create: (data: object) => api.post("/diaries", data),
  delete: (id: number) => api.delete(`/diaries/${id}`),
};

// ── 健康记录 ──
export const healthApi = {
  list: (petId: number) => api.get(`/health/${petId}`),
  create: (data: object) => api.post("/health", data),
};

// ── 云养宠 ──
export const cloudAdoptionApi = {
  list: (params: Record<string, unknown> = {}) =>
    api.get("/cloud", { params }),
  adopt: (petId: number) => api.post("/cloud", { pet_id: petId }),
};

// ── 捐赠 ──
export const donationApi = {
  create: (data: object) => api.post("/donations", data),
  list: (params: Record<string, unknown> = {}) =>
    api.get("/donations", { params }),
  update: (id: number, data: { is_verified?: boolean }) =>
    api.put(`/donations/${id}`, data),
};

// ── 志愿活动 ──
export const activityApi = {
  list: (params: { page?: number; page_size?: number; status?: string; keyword?: string } = {}) =>
    api.get("/activities", { params }),
  get: (id: number) => api.get(`/activities/${id}`),
  // 管理端
  manageList: (params: { page?: number; page_size?: number; status?: string; keyword?: string } = {}) =>
    api.get("/activities/manage/list", { params }),
  manageGet: (id: number) => api.get(`/activities/manage/${id}`),
  getEnrollments: (id: number) => api.get(`/activities/manage/${id}/enrollments`),
  create: (data: { title: string; description: string; cover_image?: string; location: string; start_time: string; end_time: string; max_participants: number }) =>
    api.post("/activities", data),
  update: (id: number, data: object) => api.put(`/activities/${id}`, data),
  updateStatus: (id: number, status: string) =>
    api.put(`/activities/${id}/status`, null, { params: { status_value: status } }),
  delete: (id: number) => api.delete(`/activities/${id}`),
  // 志愿者
  enroll: (activityId: number, note?: string) =>
    api.post(`/activities/${activityId}/enroll`, null, { params: { note: note || "" } }),
  checkIn: (activityId: number) =>
    api.post(`/activities/${activityId}/checkin`),
};

// ── 文件上传 ──
export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/upload", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── 操作日志 ──
export const operationLogApi = {
  list: (params: { page?: number; page_size?: number; target_type?: string; action?: string } = {}) =>
    api.get("/operations", { params }),
};
