<template>
  <view class="container">
    <view class="hero">
      <text class="hero-title">志愿者活动</text>
      <text class="hero-desc">用行动温暖每一个小生命</text>
    </view>

    <view class="filter-row">
      <picker mode="selector" :range="statusList" range-key="label" @change="onStatusChange">
        <view class="picker-box">{{ currentStatus.label }}</view>
      </picker>
    </view>

    <view class="activity-list">
      <view v-for="item in activities" :key="item.id" class="card" @tap="goDetail(item.id)">
        <view class="card-img-wrap">
          <image v-if="item.cover_image" :src="item.cover_image" mode="aspectFill" class="card-img" />
          <text v-else class="card-img-placeholder">🎪</text>
        </view>
        <view class="card-body">
          <text :style="{ color: statusColor[item.status] || '#d97706', fontSize: '22rpx', fontWeight: 600 }">
            {{ statusMap[item.status] || item.status }}
          </text>
          <text class="card-title">{{ item.title }}</text>
          <text class="card-info">📍 {{ item.location }}</text>
          <text class="card-info">📅 {{ formatDate(item.start_time) }}</text>
          <text class="card-enroll">👥 {{ item.enrolled_count }}/{{ item.max_participants }} 人报名</text>
        </view>
      </view>
    </view>

    <view v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @tap="prevPage">上一页</button>
      <text>{{ page }} / {{ totalPages }}</text>
      <button :disabled="page >= totalPages" @tap="nextPage">下一页</button>
    </view>

    <view v-if="!loading && activities.length === 0" class="empty-text">暂无活动</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { activityApi } from '@/api/index.js'

const PAGE_SIZE = 12
const page = ref(1)
const status = ref('')
const activities = ref([])
const total = ref(0)
const loading = ref(true)

const statusMap = { upcoming: '即将开始', ongoing: '进行中', completed: '已结束', cancelled: '已取消' }
const statusColor = { upcoming: '#d97706', ongoing: '#16a34a', completed: '#64748b', cancelled: '#ef4444' }
const statusList = [{ label: '全部状态', value: '' }, 
  ...Object.entries(statusMap).map(([k, v]) => ({ label: v, value: k }))]

const currentStatus = computed(() => statusList.find(s => s.value === status.value) || statusList[0])
const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

function onStatusChange(e) { status.value = statusList[e.detail.value].value; page.value = 1; fetchData() }
function prevPage() { page.value--; fetchData() }
function nextPage() { page.value++; fetchData() }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await activityApi.list({ page: page.value, page_size: PAGE_SIZE, status: status.value })
    activities.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages-activity/detail/detail?id=${id}` })
}

onMounted(fetchData)
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.hero { text-align: center; padding: 40rpx 0 30rpx; }
.hero-title { font-size: 40rpx; font-weight: 700; display: block; }
.hero-desc { font-size: 28rpx; color: #999; margin-top: 10rpx; display: block; }
.filter-row { margin-bottom: 20rpx; }
.picker-box { background: #fff; padding: 16rpx 24rpx; border-radius: 12rpx; border: 2rpx solid #eee; font-size: 28rpx; display: inline-block; }
.activity-list { display: flex; flex-direction: column; gap: 20rpx; }
.card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-img-wrap { height: 240rpx; background: #fef3c7; display: flex; align-items: center; justify-content: center; }
.card-img { width: 100%; height: 100%; }
.card-img-placeholder { font-size: 80rpx; }
.card-body { padding: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 600; margin: 8rpx 0; display: block; }
.card-info { font-size: 26rpx; color: #78716c; display: block; }
.card-enroll { font-size: 22rpx; color: #d97706; margin-top: 8rpx; display: block; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 30rpx; margin-top: 40rpx; }
.pagination button { padding: 10rpx 30rpx; border: 1rpx solid #eee; background: #fff; border-radius: 12rpx; font-size: 26rpx; }
.pagination text { font-size: 26rpx; color: #999; }
.empty-text { text-align: center; padding: 120rpx 0; color: #999; font-size: 28rpx; }
</style>
