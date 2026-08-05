<template>
  <view class="container">
    <view class="hero">
      <text class="hero-title">我的云养宠</text>
      <text class="hero-desc">每一份云养，都是对毛孩子的温暖守护</text>
    </view>

    <view v-if="!token" class="empty-text">
      <text>请先登录查看云养宠</text>
      <button class="btn-login" @tap="goLogin">去登录</button>
    </view>

    <view v-else-if="loading" class="empty-text">加载中...</view>

    <view v-else-if="cloudPets.length === 0" class="empty-text">
      <text>还没有云养任何宠物</text>
      <button class="btn-login" @tap="goHome">去看看待领养宠物</button>
    </view>

    <view v-else class="cloud-list">
      <view v-for="item in cloudPets" :key="item.id" class="card">
        <view class="card-img-wrap">
          <text class="card-img-placeholder">🐾</text>
        </view>
        <view class="card-body">
          <text class="card-title">宠物 #{{ item.pet_id }}</text>
          <text class="card-amount">每月赞助: ¥{{ item.monthly_amount }}</text>
          <text class="card-msg" v-if="item.message">💌 "{{ item.message }}"</text>
          <text class="card-date">开始于 {{ formatDate(item.created_at) }}</text>
          <button class="btn-cancel" @tap="handleCancel(item.id)">取消云养</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { cloudApi } from '@/api/index.js'

const token = ref(uni.getStorageSync('token') || '')
const cloudPets = ref([])
const loading = ref(true)

function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-CN') }
function goLogin() { uni.switchTab({ url: '/pages/login/login' }) }
function goHome() { uni.switchTab({ url: '/pages/index/index' }) }

async function handleCancel(cloudId) {
  const res = await new Promise(resolve => {
    uni.showModal({ title: '提示', content: '确定取消云养此宠物吗？', success: r => resolve(r.confirm) })
  })
  if (!res) return
  await cloudApi.cancel(cloudId)
  cloudPets.value = cloudPets.value.filter(c => c.id !== cloudId)
}

onMounted(async () => {
  if (!token.value) { loading.value = false; return }
  try {
    const res = await cloudApi.myCloudPets()
    cloudPets.value = res.data.items
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.hero { text-align: center; padding: 40rpx 0 30rpx; }
.hero-title { font-size: 40rpx; font-weight: 700; display: block; }
.hero-desc { font-size: 28rpx; color: #999; margin-top: 10rpx; display: block; }
.cloud-list { display: flex; flex-direction: column; gap: 20rpx; }
.card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-img-wrap { height: 240rpx; background: #fef3c7; display: flex; align-items: center; justify-content: center; }
.card-img-placeholder { font-size: 100rpx; }
.card-body { padding: 20rpx; }
.card-title { font-size: 30rpx; font-weight: 600; display: block; }
.card-amount { font-size: 28rpx; color: #d97706; font-weight: 600; margin-top: 6rpx; display: block; }
.card-msg { font-size: 24rpx; color: #78716c; margin-top: 6rpx; display: block; }
.card-date { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.btn-cancel { background: #ef4444; color: #fff; border: none; border-radius: 12rpx; font-size: 26rpx; padding: 10rpx 30rpx; margin-top: 16rpx; }
.empty-text { text-align: center; padding: 120rpx 0; color: #999; font-size: 28rpx; display: flex; flex-direction: column; align-items: center; gap: 20rpx; }
.btn-login { background: #f59e0b; color: #fff; border-radius: 16rpx; border: none; font-size: 28rpx; padding: 16rpx 40rpx; margin-top: 16rpx; }
</style>
