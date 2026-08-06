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
};

// ── 领养 ──
export const adoptionApi = {
  create: (data: { pet_id: number; message?: string }) =>
    api.post("/adoptions", data),
  list: (params: Record<string, unknown> = {}) =>
    api.get("/adoptions", { params }),
  update: (id: number, data: { status?: string; reply?: string }) =>
    api.put(`/adoptions/${id}`, data),
};

// ── 救助知识 ──
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
