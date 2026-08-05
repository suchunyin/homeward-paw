<template>
  <view class="page-auth">
    <view class="auth-card">
      <view class="auth-header">
        <text class="title">创建账号</text>
      </view>

      <u-form label-width="0" :model="form">
        <u-form-item>
          <u-input
            v-model="form.username"
            placeholder="用户名"
            prefixIcon="account"
            border="bottom"
            clearable
          />
        </u-form-item>

        <u-form-item>
          <u-input
            v-model="form.email"
            placeholder="邮箱"
            prefixIcon="email"
            border="bottom"
          />
        </u-form-item>

        <u-form-item>
          <u-input
            v-model="form.password"
            type="password"
            placeholder="密码（至少6位）"
            prefixIcon="lock"
            border="bottom"
          />
        </u-form-item>

        <u-form-item>
          <view class="role-selector">
            <text class="role-label">注册身份</text>
            <view class="role-options">
              <view
                class="role-option"
                :class="{ active: form.role === 'adopter' }"
                @tap="form.role = 'adopter'"
              >
                <text class="role-icon">👤</text>
                <text>领养者</text>
              </view>
              <view
                class="role-option"
                :class="{ active: form.role === 'shelter' }"
                @tap="form.role = 'shelter'"
              >
                <text class="role-icon">🏠</text>
                <text>救助站</text>
              </view>
            </view>
          </view>
        </u-form-item>
      </u-form>

      <u-button
        type="warning"
        text="注册"
        shape="circle"
        :loading="loading"
        @click="onRegister"
      />

      <view class="auth-link">
        <text>已有账号？</text>
        <text class="link" @tap="goLogin">去登录</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { userApi } from '@/api/index.js'

const form = reactive({
  username: '',
  email: '',
  password: '',
  role: 'adopter'
})
const loading = ref(false)

async function onRegister() {
  if (!form.username || !form.email || !form.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }
  if (form.password.length < 6) {
    uni.showToast({ title: '密码至少6位', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res = await userApi.register({
      username: form.username,
      email: form.email,
      password: form.password,
      role: form.role
    })
    const { access_token, user } = res.data
    uni.setStorageSync('token', access_token)
    uni.setStorageSync('user', JSON.stringify(user))

    uni.showToast({ title: '注册成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (e) {
    uni.showToast({
      title: e.response?.data?.detail || '注册失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

function goLogin() {
  uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page-auth {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #fef3c7, #fde68a);
  padding: 40rpx;
}

.auth-card {
  width: 100%;
  max-width: 600rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 60rpx 48rpx;
  box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.08);
}

.auth-header {
  text-align: center;
  margin-bottom: 48rpx;

  .title {
    font-size: 40rpx;
    font-weight: 700;
    color: #333;
  }
}

.role-selector {
  padding-top: 16rpx;

  .role-label {
    font-size: 28rpx;
    color: #666;
    margin-bottom: 16rpx;
    display: block;
  }
}

.role-options {
  display: flex;
  gap: 24rpx;
}

.role-option {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
  border: 2rpx solid #e5e5e5;
  border-radius: 16rpx;
  font-size: 26rpx;
  color: #666;
  transition: all 0.25s;

  &.active {
    border-color: #f59e0b;
    background: #fef3c7;
    color: #f59e0b;
    font-weight: 600;
  }

  .role-icon {
    font-size: 40rpx;
    margin-bottom: 8rpx;
  }
}

.auth-link {
  text-align: center;
  margin-top: 32rpx;
  font-size: 28rpx;
  color: #999;

  .link {
    color: #f59e0b;
    margin-left: 8rpx;
  }
}
</style>
