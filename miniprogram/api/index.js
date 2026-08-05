// ═══════════════════════════════════════════
// API 封装 - UniApp 微信小程序
// ═══════════════════════════════════════════

const BASE_URL = 'http://127.0.0.1:8000/api'

// 通用请求方法
function request(options = {}) {
  const token = uni.getStorageSync('token')

  return new Promise((resolve, reject) => {
    uni.request({
      url: BASE_URL + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.header
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res)
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user')
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          reject(res)
        } else {
          reject(res)
        }
      },
      fail(err) {
        uni.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// ─── 用户 API ───
export const userApi = {
  register(data) {
    return request({ url: '/users/register', method: 'POST', data })
  },
  login(data) {
    return request({ url: '/users/login', method: 'POST', data })
  },
  getMe() {
    return request({ url: '/users/me' })
  }
}

// ─── 宠物 API ───
export const petApi = {
  list(params) {
    return request({ url: '/pets', data: params })
  },
  detail(id) {
    return request({ url: `/pets/${id}` })
  },
  create(data) {
    return request({ url: '/pets', method: 'POST', data })
  },
  update(id, data) {
    return request({ url: `/pets/${id}`, method: 'PUT', data })
  },
  remove(id) {
    return request({ url: `/pets/${id}`, method: 'DELETE' })
  }
}

// ─── 领养 API ───
export const adoptionApi = {
  create(data) {
    return request({ url: '/adoptions', method: 'POST', data })
  },
  myApplications() {
    return request({ url: '/adoptions' })
  },
  receivedApplications() {
    return request({ url: '/adoptions/received' })
  },
  update(id, data) {
    return request({ url: `/adoptions/${id}`, method: 'PUT', data })
  }
}

// ─── 知识文章 API ───
export const knowledgeApi = {
  list(params) {
    return request({ url: '/knowledge', data: params })
  },
  detail(id) {
    return request({ url: `/knowledge/${id}` })
  }
}

// ─── 云养宠 API ───
export const cloudApi = {
  myCloudPets() {
    return request({ url: '/cloud/my' })
  },
  start(data) {
    return request({ url: '/cloud', method: 'POST', data })
  },
  cancel(id) {
    return request({ url: `/cloud/${id}/cancel`, method: 'POST' })
  }
}

// ─── 捐赠 API ───
export const donationApi = {
  list(params) {
    return request({ url: '/donations', data: params })
  },
  create(data) {
    return request({ url: '/donations', method: 'POST', data })
  },
  myDonations(params) {
    return request({ url: '/donations/my', data: params })
  }
}

// ─── 活动 API ───
export const activityApi = {
  list(params) {
    return request({ url: '/activities', data: params })
  },
  detail(id) {
    return request({ url: `/activities/${id}` })
  },
  enroll(activityId) {
    return request({ url: `/activities/${activityId}/enroll`, method: 'POST', data: { activity_id: activityId, note: '' } })
  },
  checkin(activityId) {
    return request({ url: `/activities/${activityId}/checkin`, method: 'POST' })
  }
}

export default request
