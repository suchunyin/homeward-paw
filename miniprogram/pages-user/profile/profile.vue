<template>
  <view class="page-profile">
    <!-- 用户信息 -->
    <view class="profile-header">
      <view class="avatar">🐾</view>
      <text class="username">{{ user?.username || '未登录' }}</text>
      <text class="role-tag">{{ roleMap[user?.role] || '' }}</text>
      <text class="email">{{ user?.email || '' }}</text>
    </view>

    <!-- 菜单 -->
    <view class="menu-list">
      <view class="menu-item" @tap="goApplications">
        <u-icon name="file-text" size="22" color="#f59e0b" />
        <text class="menu-text">我的领养申请</text>
        <u-icon name="arrow-right" size="16" color="#ccc" />
      </view>

      <view
        v-if="user?.role === 'shelter'"
        class="menu-item"
        @tap="goReceived"
      >
        <u-icon name="email" size="22" color="#f59e0b" />
        <text class="menu-text">收到的申请</text>
        <u-icon name="arrow-right" size="16" color="#ccc" />
      </view>

      <view class="menu-item" @tap="goPublish">
        <u-icon name="plus-circle" size="22" color="#f59e0b" />
        <text class="menu-text">发布领养信息</text>
        <u-icon name="arrow-right" size="16" color="#ccc" />
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-wrap">
      <u-button
        text="退出登录"
        shape="circle"
        plain
        @click="onLogout"
      />
    </view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const user = ref(null)
const roleMap = { adopter: '领养者', shelter: '救助站', admin: '管理员' }

onMounted(() => {
  const userStr = uni.getStorageSync('user')
  if (userStr) {
    user.value = JSON.parse(userStr)
  } else {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/login' })
    }, 800)
  }
})

function goApplications() {
  uni.navigateTo({ url: '/pages-user/applications/applications' })
}

function goReceived() {
  uni.navigateTo({ url: '/pages-user/received/received' })
}

function goPublish() {
  uni.navigateTo({ url: '/pages-publish/index/index' })
}

function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success(res) {
      if (res.confirm) {
        uni.removeStorageSync('token')
        uni.removeStorageSync('user')
        uni.switchTab({ url: '/pages/index/index' })
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page-profile {
  background: #f5f5f5;
  min-height: 100vh;
}

.profile-header {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 60rpx 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 56rpx;
  margin-bottom: 16rpx;
}

.username {
  font-size: 36rpx;
  font-weight: 700;
  color: #fff;
}

.role-tag {
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.3);
  color: #fff;
  padding: 4rpx 20rpx;
  border-radius: 20rpx;
  margin-top: 8rpx;
}

.email {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 8rpx;
}

.menu-list {
  background: #fff;
  margin: 24rpx;
  border-radius: 16rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 32rpx 24rpx;
  border-bottom: 1rpx solid #f5f5f5;

  &:last-child {
    border-bottom: none;
  }

  .menu-text {
    flex: 1;
    margin-left: 16rpx;
    font-size: 30rpx;
    color: #333;
  }
}

.logout-wrap {
  padding: 40rpx 24rpx;
}
</style>
