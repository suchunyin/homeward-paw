import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// 请求拦截器：自动附加 token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 响应拦截器：统一处理 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ─── 用户 API ───
export const userApi = {
  register: (data: { username: string; email: string; password: string; role: string }) =>
    api.post("/users/register", data),
  login: (data: { username: string; password: string }) =>
    api.post("/users/login", data),
  getMe: () => api.get("/users/me"),
};

// ─── 宠物 API ───
export const petApi = {
  list: (params?: Record<string, any>) =>
    api.get("/pets", { params }),
  detail: (id: number) => api.get(`/pets/${id}`),
  create: (data: Record<string, any>) => api.post("/pets", data),
  update: (id: number, data: Record<string, any>) => api.put(`/pets/${id}`, data),
  remove: (id: number) => api.delete(`/pets/${id}`),
};

// ─── 领养 API ───
export const adoptionApi = {
  create: (data: { pet_id: number; message: string }) =>
    api.post("/adoptions", data),
  myApplications: () => api.get("/adoptions"),
  receivedApplications: () => api.get("/adoptions/received"),
  update: (id: number, data: Record<string, any>) =>
    api.put(`/adoptions/${id}`, data),
};

// ─── 知识文章 API ───
export const knowledgeApi = {
  list: (params?: Record<string, any>) => api.get("/knowledge", { params }),
  categories: () => api.get("/knowledge/categories"),
  detail: (id: number) => api.get(`/knowledge/${id}`),
  create: (data: Record<string, any>) => api.post("/knowledge", data),
  update: (id: number, data: Record<string, any>) => api.put(`/knowledge/${id}`, data),
  remove: (id: number) => api.delete(`/knowledge/${id}`),
};

// ─── 宠物日记 API ───
export const diaryApi = {
  list: (params?: Record<string, any>) => api.get("/diaries", { params }),
  detail: (id: number) => api.get(`/diaries/${id}`),
  create: (data: Record<string, any>) => api.post("/diaries", data),
  remove: (id: number) => api.delete(`/diaries/${id}`),
};

// ─── 健康档案 API ───
export const healthApi = {
  listByPet: (petId: number, params?: Record<string, any>) =>
    api.get(`/health/pet/${petId}`, { params }),
  detail: (id: number) => api.get(`/health/${id}`),
  create: (data: Record<string, any>) => api.post("/health", data),
  remove: (id: number) => api.delete(`/health/${id}`),
};

// ─── 云养宠 API ───
export const cloudApi = {
  myCloudPets: () => api.get("/cloud/my"),
  petSupporters: (petId: number) => api.get(`/cloud/pet/${petId}`),
  start: (data: { pet_id: number; monthly_amount: number; message: string }) =>
    api.post("/cloud", data),
  cancel: (id: number) => api.post(`/cloud/${id}/cancel`),
};

// ─── 捐赠 API ───
export const donationApi = {
  list: (params?: Record<string, any>) => api.get("/donations", { params }),
  myDonations: (params?: Record<string, any>) => api.get("/donations/my", { params }),
  create: (data: Record<string, any>) => api.post("/donations", data),
  verify: (id: number) => api.put(`/donations/${id}/verify`),
};

// ─── 活动 API ───
export const activityApi = {
  list: (params?: Record<string, any>) => api.get("/activities", { params }),
  detail: (id: number) => api.get(`/activities/${id}`),
  create: (data: Record<string, any>) => api.post("/activities", data),
  update: (id: number, data: Record<string, any>) => api.put(`/activities/${id}`, data),
  enroll: (activityId: number, data: { activity_id: number; note: string }) =>
    api.post(`/activities/${activityId}/enroll`, data),
  checkin: (activityId: number) => api.post(`/activities/${activityId}/checkin`),
  enrollments: (activityId: number) => api.get(`/activities/${activityId}/enrollments`),
};

export default api;
