<template>
  <view class="page-apps">
    <view v-if="loading" class="center-wrap">
      <u-loading-icon />
    </view>

    <view v-else-if="list.length === 0" class="center-wrap">
      <u-empty text="暂无申请记录" mode="list" />
    </view>

    <view v-else class="app-list">
      <view v-for="item in list" :key="item.id" class="app-card">
        <view class="app-row">
          <text class="label">宠物ID</text>
          <text class="value">{{ item.pet_id }}</text>
        </view>
        <view class="app-row">
          <text class="label">申请留言</text>
          <text class="value">{{ item.message || '无' }}</text>
        </view>
        <view class="app-row">
          <text class="label">状态</text>
          <text class="status-text" :class="'s-' + item.status">
            {{ statusMap[item.status] || item.status }}
          </text>
        </view>
        <view v-if="item.reply" class="app-row">
          <text class="label">回复</text>
          <text class="value reply">{{ item.reply }}</text>
        </view>
        <text class="app-time">{{ formatTime(item.created_at) }}</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { adoptionApi } from '@/api/index.js'

const list = ref([])
const loading = ref(true)

const statusMap = {
  pending: '审核中',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
  completed: '已完成'
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN')
}

onMounted(async () => {
  try {
    const res = await adoptionApi.myApplications()
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.page-apps {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.app-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.app-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.app-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8rpx;

  .label {
    font-size: 26rpx;
    color: #999;
    flex-shrink: 0;
  }

  .value {
    font-size: 26rpx;
    color: #333;
    text-align: right;
    max-width: 400rpx;
  }

  .reply {
    background: #fef3c7;
    padding: 8rpx 12rpx;
    border-radius: 8rpx;
  }
}

.status-text {
  font-size: 26rpx;
  font-weight: 600;
}

.s-pending { color: #f59e0b; }
.s-approved { color: #16a34a; }
.s-rejected { color: #ef4444; }
.s-cancelled { color: #999; }

.app-time {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 12rpx;
}

.center-wrap {
  display: flex;
  justify-content: center;
  padding-top: 300rpx;
}
</style>
