<template>
  <view class="container">
    <view class="hero">
      <text class="hero-title">爱心捐赠公示</text>
      <text class="hero-desc">每一份善意都值得被看见</text>
    </view>

    <view class="donation-list">
      <view v-for="item in donations" :key="item.id" class="card">
        <view class="card-icon" :style="{ background: item.donation_type === 'cash' ? '#fef3c7' : '#dbeafe' }">
          <text style="font-size: 50rpx;">{{ item.donation_type === 'cash' ? '💰' : '📦' }}</text>
        </view>
        <view class="card-body">
          <text class="card-user">{{ item.is_anonymous ? '匿名爱心人士' : '用户 #' + item.user_id }}</text>
          <text class="card-amount" v-if="item.donation_type === 'cash'">捐赠 ¥{{ item.amount }}</text>
          <text class="card-amount" v-else>捐赠 {{ item.goods_name }} ×{{ item.goods_quantity }}</text>
          <text class="card-msg" v-if="item.message">💌 "{{ item.message }}"</text>
          <text class="card-pet" v-if="item.pet_id">指定宠物 #{{ item.pet_id }}</text>
          <text class="card-time">{{ formatDate(item.created_at) }} · {{ item.is_verified ? '✅ 已确认' : '⏳ 待确认' }}</text>
        </view>
      </view>
    </view>

    <view v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @tap="prevPage">上一页</button>
      <text>{{ page }} / {{ totalPages }}</text>
      <button :disabled="page >= totalPages" @tap="nextPage">下一页</button>
    </view>

    <view v-if="!loading && donations.length === 0" class="empty-text">暂无捐赠记录</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { donationApi } from '@/api/index.js'

const PAGE_SIZE = 12
const page = ref(1)
const donations = ref([])
const total = ref(0)
const loading = ref(true)
const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

function formatDate(d) { if (!d) return ''; return new Date(d).toLocaleDateString('zh-CN') }
function prevPage() { page.value--; fetchData() }
function nextPage() { page.value++; fetchData() }

async function fetchData() {
  loading.value = true
  try {
    const res = await donationApi.list({ page: page.value, page_size: PAGE_SIZE })
    donations.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

onMounted(fetchData)
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.hero { text-align: center; padding: 40rpx 0 30rpx; }
.hero-title { font-size: 40rpx; font-weight: 700; display: block; }
.hero-desc { font-size: 28rpx; color: #999; margin-top: 10rpx; display: block; }
.donation-list { display: flex; flex-direction: column; gap: 20rpx; }
.card { background: #fff; border-radius: 16rpx; padding: 24rpx; display: flex; gap: 20rpx; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-icon { width: 100rpx; height: 100rpx; border-radius: 16rpx; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.card-body { flex: 1; }
.card-user { font-size: 30rpx; font-weight: 600; display: block; }
.card-amount { font-size: 28rpx; color: #d97706; font-weight: 600; margin-top: 6rpx; display: block; }
.card-msg { font-size: 24rpx; color: #78716c; margin-top: 6rpx; display: block; }
.card-pet { font-size: 22rpx; color: #d97706; margin-top: 4rpx; display: block; }
.card-time { font-size: 22rpx; color: #999; margin-top: 8rpx; display: block; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 30rpx; margin-top: 40rpx; }
.pagination button { padding: 10rpx 30rpx; border: 1rpx solid #eee; background: #fff; border-radius: 12rpx; font-size: 26rpx; }
.pagination text { font-size: 26rpx; color: #999; }
.empty-text { text-align: center; padding: 120rpx 0; color: #999; font-size: 28rpx; }
</style>
