<template>
  <view class="page-received">
    <view v-if="loading" class="center-wrap">
      <u-loading-icon />
    </view>

    <view v-else-if="list.length === 0" class="center-wrap">
      <u-empty text="暂无收到申请" mode="list" />
    </view>

    <view v-else class="list-wrap">
      <view
        v-for="item in list"
        :key="item.id"
        class="card"
      >
        <view class="card-row">
          <text class="card-label">宠物ID</text>
          <text class="card-value">{{ item.pet_id }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">申请人ID</text>
          <text class="card-value">{{ item.user_id }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">留言</text>
          <text class="card-value">{{ item.message || '无' }}</text>
        </view>
        <view class="card-row">
          <text class="card-label">状态</text>
          <text class="card-value s" :class="'s-' + item.status">
            {{ statusMap[item.status] || item.status }}
          </text>
        </view>
        <text class="card-time">{{ formatTime(item.created_at) }}</text>

        <!-- 审核按钮 -->
        <view v-if="item.status === 'pending'" class="card-actions">
          <u-button
            type="success"
            text="通过"
            size="small"
            @click="onReview(item.id, 'approved')"
          />
          <u-button
            type="error"
            text="拒绝"
            size="small"
            plain
            @click="onReview(item.id, 'rejected')"
          />
        </view>
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
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
  cancelled: '已取消',
  completed: '已完成'
}

function formatTime(t) {
  if (!t) return ''
  return new Date(t).toLocaleDateString('zh-CN')
}

async function fetchData() {
  loading.value = true
  try {
    const res = await adoptionApi.receivedApplications()
    list.value = res.data
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function onReview(id, status) {
  try {
    await adoptionApi.update(id, { status })
    uni.showToast({
      title: status === 'approved' ? '已通过' : '已拒绝',
      icon: 'success'
    })
    fetchData()
  } catch (e) {
    uni.showToast({ title: '操作失败', icon: 'none' })
  }
}

onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.page-received {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.list-wrap {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.card-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;

  .card-label {
    font-size: 26rpx;
    color: #999;
  }

  .card-value {
    font-size: 26rpx;
    color: #333;
    text-align: right;
    max-width: 400rpx;
  }
}

.s-pending { color: #f59e0b; font-weight: 600; }
.s-approved { color: #16a34a; }
.s-rejected { color: #ef4444; }

.card-time {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #bbb;
  margin: 8rpx 0 16rpx;
}

.card-actions {
  display: flex;
  gap: 16rpx;
  justify-content: flex-end;
}

.center-wrap {
  display: flex;
  justify-content: center;
  padding-top: 300rpx;
}
</style>
