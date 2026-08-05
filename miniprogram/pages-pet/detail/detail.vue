<template>
  <view class="page-detail">
    <!-- 封面 -->
    <view class="cover-wrap">
      <image
        v-if="pet.cover_image"
        :src="pet.cover_image"
        mode="aspectFill"
        class="cover-img"
      />
      <view v-else class="cover-placeholder">
        <text class="placeholder-icon">{{ pet.species === '猫' ? '🐱' : '🐶' }}</text>
      </view>
    </view>

    <!-- 基本信息 -->
    <view class="info-card">
      <view class="name-row">
        <text class="pet-name">{{ pet.name }}</text>
        <text
          class="status-tag"
          :class="'status-' + pet.status"
        >
          {{ statusMap[pet.status] || pet.status }}
        </text>
      </view>

      <view class="tag-row">
        <text class="tag">{{ pet.species }}</text>
        <text class="tag" v-if="pet.breed">{{ pet.breed }}</text>
        <text class="tag">{{ pet.age }}个月</text>
        <text class="tag">{{ genderMap[pet.gender] || '未知' }}</text>
        <text class="tag">{{ sizeMap[pet.size] || '中型' }}</text>
      </view>

      <text class="location">📍 {{ pet.city }} {{ pet.district }}</text>
    </view>

    <!-- 健康状况 -->
    <view class="section-card">
      <text class="section-title">健康状况</text>
      <text class="section-content">{{ pet.health_status || '暂无信息' }}</text>
      <view class="health-badges">
        <text :class="pet.is_vaccinated ? 'badge-green' : 'badge-gray'">
          {{ pet.is_vaccinated ? '✅ 已疫苗' : '❌ 未疫苗' }}
        </text>
        <text :class="pet.is_neutered ? 'badge-green' : 'badge-gray'">
          {{ pet.is_neutered ? '✅ 已绝育' : '❌ 未绝育' }}
        </text>
      </view>
    </view>

    <!-- 简介 -->
    <view class="section-card">
      <text class="section-title">简介</text>
      <text class="section-content">{{ pet.description || '暂无简介' }}</text>
    </view>

    <!-- 领养申请区域 -->
    <view v-if="pet.status === 'available'" class="apply-card">
      <text class="section-title">申请领养</text>
      <u-textarea
        v-model="message"
        placeholder="请简单介绍你的养宠经验、居住环境等..."
        count
        maxlength="300"
      />
      <u-button
        type="warning"
        text="提交领养申请"
        shape="circle"
        :loading="submitting"
        @click="onApply"
      />
    </view>

    <view v-else class="apply-card">
      <text class="unavailable-text">该宠物暂不可领养</text>
    </view>

    <!-- 底部安全区 -->
    <view style="height: 40rpx" />
  </view>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { petApi, adoptionApi } from '@/api/index.js'

const pet = reactive({
  id: 0, name: '', species: '', breed: '', age: 0, gender: '',
  size: '', color: '', description: '', health_status: '',
  is_vaccinated: false, is_neutered: false,
  city: '', district: '', cover_image: '', status: ''
})

const message = ref('')
const submitting = ref(false)

const statusMap = { available: '可领养', pending: '审核中', adopted: '已领养', hidden: '已隐藏' }
const genderMap = { male: '公', female: '母' }
const sizeMap = { small: '小型', medium: '中型', large: '大型' }

onMounted(async () => {
  const pages = getCurrentPages()
  const current = pages[pages.length - 1]
  const id = current.options?.id
  if (!id) {
    uni.showToast({ title: '参数错误', icon: 'none' })
    return
  }

  try {
    const res = await petApi.detail(Number(id))
    Object.assign(pet, res.data)
  } catch (e) {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
})

async function onApply() {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  if (!message.value.trim()) {
    uni.showToast({ title: '请填写申请留言', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    await adoptionApi.create({ pet_id: pet.id, message: message.value })
    uni.showToast({ title: '申请已提交', icon: 'success' })
    message.value = ''
  } catch (e) {
    uni.showToast({
      title: e.data?.detail || '提交失败',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-detail {
  background: #f5f5f5;
  min-height: 100vh;
}

.cover-wrap {
  width: 100%;
  height: 500rpx;
  background: #fef3c7;
}

.cover-img {
  width: 100%;
  height: 100%;
}

.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  .placeholder-icon {
    font-size: 140rpx;
  }
}

.info-card {
  background: #fff;
  margin: -40rpx 24rpx 16rpx;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
  position: relative;
  z-index: 1;
}

.name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.pet-name {
  font-size: 40rpx;
  font-weight: 700;
  color: #333;
}

.status-tag {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.status-available {
  background: #dcfce7;
  color: #16a34a;
}

.status-adopted {
  background: #f1f5f9;
  color: #64748b;
}

.tag-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.tag {
  background: #fef3c7;
  color: #d97706;
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.location {
  font-size: 26rpx;
  color: #666;
}

.section-card {
  background: #fff;
  margin: 0 24rpx 16rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 12rpx;
}

.section-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.6;
}

.health-badges {
  display: flex;
  gap: 16rpx;
  margin-top: 16rpx;
}

.badge-green {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  background: #dcfce7;
  color: #16a34a;
  border-radius: 8rpx;
}

.badge-gray {
  font-size: 24rpx;
  padding: 6rpx 16rpx;
  background: #f1f5f9;
  color: #64748b;
  border-radius: 8rpx;
}

.apply-card {
  background: #fff;
  margin: 0 24rpx;
  border-radius: 16rpx;
  padding: 24rpx;
}

.unavailable-text {
  display: block;
  text-align: center;
  color: #999;
  font-size: 28rpx;
  padding: 32rpx 0;
}
</style>
