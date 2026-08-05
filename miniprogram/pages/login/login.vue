<template>
  <view class="page-auth">
    <view class="auth-card">
      <view class="auth-header">
        <text class="logo-icon">🐾</text>
        <text class="title">Homeward Paw</text>
        <text class="subtitle">让每一个生命都有家可归</text>
      </view>

      <u-form label-width="0" :model="form" ref="formRef">
        <u-form-item>
          <u-input
            v-model="form.username"
            placeholder="请输入用户名"
            prefixIcon="account"
            border="bottom"
            clearable
          />
        </u-form-item>

        <u-form-item>
          <u-input
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            prefixIcon="lock"
            border="bottom"
          />
        </u-form-item>
      </u-form>

      <u-button
        type="warning"
        text="登录"
        shape="circle"
        :loading="loading"
        @click="onLogin"
      />

      <view class="auth-link">
        <text>还没有账号？</text>
        <text class="link" @tap="goRegister">立即注册</text>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { userApi } from '@/api/index.js'

const form = reactive({ username: '', password: '' })
const loading = ref(false)

async function onLogin() {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请填写完整信息', icon: 'none' })
    return
  }

  loading.value = true
  try {
    const res = await userApi.login({
      username: form.username,
      password: form.password
    })
    const { access_token, user } = res.data
    uni.setStorageSync('token', access_token)
    uni.setStorageSync('user', JSON.stringify(user))

    uni.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 500)
  } catch (e) {
    uni.showToast({
      title: e.response?.data?.detail || '登录失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

function goRegister() {
  uni.navigateTo({ url: '/pages/register/register' })
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

  .logo-icon {
    font-size: 72rpx;
  }

  .title {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: #333;
    margin-top: 16rpx;
  }

  .subtitle {
    display: block;
    font-size: 26rpx;
    color: #999;
    margin-top: 8rpx;
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
