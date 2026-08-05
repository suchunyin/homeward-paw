<template>
  <view class="container" v-if="activity">
    <view class="hero-img">
      <image v-if="activity.cover_image" :src="activity.cover_image" mode="aspectFill" class="img" />
      <text v-else class="img-placeholder">🎪</text>
    </view>

    <text class="title">{{ activity.title }}</text>
    <view class="tags">
      <text class="tag">{{ statusMap[activity.status] }}</text>
      <text class="tag">👥 {{ activity.enrolled_count }}/{{ activity.max_participants }}</text>
    </view>

    <view class="info-block">
      <text class="info-label">📅 活动时间</text>
      <text>{{ formatDateTime(activity.start_time) }} ~ {{ formatDateTime(activity.end_time) }}</text>
    </view>
    <view class="info-block">
      <text class="info-label">📍 活动地点</text>
      <text>{{ activity.location }}</text>
    </view>
    <view class="info-block">
      <text class="info-label">📝 活动介绍</text>
      <text class="desc">{{ activity.description }}</text>
    </view>

    <view v-if="activity.status === 'upcoming' && activity.enrolled_count < activity.max_participants" class="action-section">
      <button class="btn-primary" @tap="handleEnroll" v-if="!enrolled">
        立即报名
      </button>
      <text v-if="msg" :style="{ color: enrolled ? '#16a34a' : '#ef4444', marginTop: '16rpx', display: 'block', textAlign: 'center' }">{{ msg }}</text>
    </view>
    <view v-if="activity.status === 'ongoing'" class="action-section">
      <button class="btn-primary" @tap="handleCheckin">签到打卡</button>
      <text v-if="msg" :style="{ color: '#16a34a', marginTop: '16rpx', display: 'block', textAlign: 'center' }">{{ msg }}</text>
    </view>
  </view>
  <view v-else-if="loading" class="empty-text">加载中...</view>
  <view v-else class="empty-text">活动不存在</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { activityApi } from '@/api/index.js'

const id = ref(0)
const activity = ref(null)
const loading = ref(true)
const enrolled = ref(false)
const msg = ref('')

const statusMap = { upcoming: '即将开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消' }

function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-CN') }
function formatDateTime(d) { if (!d) return ''; return new Date(d).toLocaleString('zh-CN') }

onMounted(() => {
  const instance = getCurrentPages()
  const options = instance[instance.length - 1].options || instance[instance.length - 1].$route?.query || {}
  id.value = Number(options.id || 0)
  if (id.value) {
    activityApi.detail(id.value).then(res => {
      activity.value = res.data
    }).finally(() => loading.value = false)
  }
})

async function handleEnroll() {
  try {
    await activityApi.enroll(id.value)
    enrolled.value = true
    msg.value = '报名成功！'
    const res = await activityApi.detail(id.value)
    activity.value = res.data
  } catch (e) {
    msg.value = e.data?.detail || '报名失败'
  }
}

async function handleCheckin() {
  try {
    await activityApi.checkin(id.value)
    msg.value = '签到成功！'
  } catch (e) {
    msg.value = e.data?.detail || '签到失败'
  }
}
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.hero-img { height: 400rpx; border-radius: 16rpx; overflow: hidden; background: #fef3c7; display: flex; align-items: center; justify-content: center; }
.img { width: 100%; height: 100%; }
.img-placeholder { font-size: 120rpx; }
.title { font-size: 40rpx; font-weight: 700; margin-top: 24rpx; display: block; }
.tags { display: flex; gap: 16rpx; margin: 20rpx 0; }
.tag { background: #fef3c7; color: #d97706; padding: 6rpx 24rpx; border-radius: 20rpx; font-size: 24rpx; }
.info-block { margin-bottom: 24rpx; }
.info-label { font-size: 26rpx; color: #999; display: block; margin-bottom: 6rpx; }
.info-block text:last-child { font-size: 28rpx; display: block; }
.desc { white-space: pre-wrap; line-height: 1.8; }
.action-section { margin-top: 40rpx; }
.btn-primary { background: #f59e0b; color: #fff; border-radius: 16rpx; border: none; font-size: 30rpx; padding: 20rpx; }
.empty-text { text-align: center; padding: 200rpx 0; color: #999; font-size: 28rpx; }
</style>
