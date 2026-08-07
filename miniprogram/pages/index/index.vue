<template>
  <view class="page-home">
    <!-- 搜索栏 -->
    <view class="search-box">
      <u-search
        v-model="keyword"
        placeholder="搜索宠物名称"
        :show-action="false"
        shape="round"
        bg-color="#fff"
        @search="onSearch"
        @custom="onSearch"
      />
      <view class="filter-bar">
        <scroll-view scroll-x class="species-tabs">
          <view
            v-for="s in speciesList"
            :key="s.value"
            class="tab-item"
            :class="{ active: species === s.value }"
            @tap="onSpeciesChange(s.value)"
          >
            {{ s.label }}
          </view>
        </scroll-view>
      </view>
    </view>

    <!-- 功能入口 -->
    <view class="quick-nav">
      <view class="nav-item" @tap="goPage('/pages-knowledge/list/list')">
        <text class="nav-icon">📖</text>
        <text class="nav-label">宠物知识</text>
      </view>
      <view class="nav-item" @tap="goPage('/pages-activity/list/list')">
        <text class="nav-icon">🎪</text>
        <text class="nav-label">志愿者活动</text>
      </view>
      <view class="nav-item" @tap="goPage('/pages-donate/list/list')">
        <text class="nav-icon">❤️</text>
        <text class="nav-label">爱心捐赠</text>
      </view>
      <view class="nav-item" @tap="goPage('/pages-cloud/list/list')">
        <text class="nav-icon">☁️</text>
        <text class="nav-label">云养宠</text>
      </view>
    </view>

    <!-- 宠物列表 -->
    <scroll-view
      scroll-y
      class="pet-list"
      @scrolltolower="onLoadMore"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <view v-if="loading && pets.length === 0" class="loading-wrap">
        <u-loading-icon />
        <text>加载中...</text>
      </view>

      <view v-else-if="pets.length === 0" class="empty-wrap">
        <u-empty text="暂无待领养宠物" mode="list" />
      </view>

      <view v-else class="pet-grid">
        <view
          v-for="pet in pets"
          :key="pet.id"
          class="pet-card"
          @tap="goDetail(pet.id)"
        >
          <image
            :src="pet.cover_image || defaultCover"
            mode="aspectFill"
            class="pet-cover"
          />
          <view class="pet-info">
            <text class="pet-name">{{ pet.name }}</text>
            <text class="pet-meta">
              {{ pet.breed || pet.species }} · {{ pet.age }}个月
            </text>
            <text class="pet-city">{{ pet.city || '未知城市' }}</text>
          </view>
        </view>
      </view>

      <u-loadmore
        v-if="pets.length > 0"
        :status="loadStatus"
        loading-text="加载中..."
        loadmore-text="上拉加载更多"
        nomore-text="没有更多了"
      />
    </scroll-view>

    <!-- 底部发布按钮 -->
    <view class="float-btn" @tap="goPublish">
      <u-icon name="plus" color="#fff" size="28" />
    </view>

    <!-- TabBar -->
    <u-tabbar :value="0" :fixed="true" :safeAreaInsetBottom="true" @change="onTabChange">
      <u-tabbar-item text="首页" icon="home" />
      <u-tabbar-item text="个人中心" icon="account" />
    </u-tabbar>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { petApi } from '@/api/index.js'

const keyword = ref('')
const species = ref('')
const pets = ref([])
const page = ref(1)
const total = ref(0)
const loading = ref(false)
const refreshing = ref(false)

const speciesList = [
  { label: '全部', value: '' },
  { label: '🐶 狗狗', value: '狗' },
  { label: '🐱 猫咪', value: '猫' },
  { label: '🐰 其他', value: '其他' }
]

const defaultCover = '/static/default-pet.png'

const loadStatus = computed(() => {
  if (loading.value) return 'loading'
  if (pets.value.length >= total.value) return 'nomore'
  return 'loadmore'
})

async function fetchPets(isRefresh = false) {
  if (loading.value) return
  loading.value = true

  if (isRefresh) {
    page.value = 1
  }

  try {
    const params = {
      page: page.value,
      page_size: 12,
    }
    if (species.value) params.species = species.value
    if (keyword.value) params.keyword = keyword.value

    const res = await petApi.list(params)
    const { items, total: t } = res.data

    if (isRefresh) {
      pets.value = items
    } else {
      pets.value = [...pets.value, ...items]
    }
    total.value = t
  } catch (e) {
    console.error('加载宠物列表失败', e)
    uni.showToast({ title: '加载失败', icon: 'none' })
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function onSearch() {
  page.value = 1
  pets.value = []
  fetchPets(true)
}

function onSpeciesChange(val) {
  species.value = val
  page.value = 1
  pets.value = []
  fetchPets(true)
}

function onRefresh() {
  refreshing.value = true
  fetchPets(true)
}

function onLoadMore() {
  if (loading.value || pets.value.length >= total.value) return
  page.value++
  fetchPets()
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages-pet/detail/detail?id=${id}` })
}

function goPublish() {
  const token = uni.getStorageSync('token')
  if (!token) {
    uni.navigateTo({ url: '/pages/login/login' })
    return
  }
  uni.navigateTo({ url: '/pages-publish/index/index' })
}

function goPage(url) {
  uni.navigateTo({ url })
}

function onTabChange(index) {
  if (index === 0) return
  if (index === 1) {
    const token = uni.getStorageSync('token')
    if (!token) {
      uni.navigateTo({ url: '/pages/login/login' })
      return
    }
    uni.navigateTo({ url: '/pages-user/profile/profile' })
  }
}

onMounted(() => {
  fetchPets(true)
})
</script>

<style lang="scss" scoped>
.page-home {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.search-box {
  background: #f59e0b;
  padding: 16rpx 24rpx 16rpx;
}

.filter-bar {
  margin-top: 12rpx;
}

.species-tabs {
  white-space: nowrap;
  display: flex;

  .tab-item {
    display: inline-block;
    padding: 8rpx 28rpx;
    font-size: 26rpx;
    color: #fff;
    opacity: 0.7;
    border-radius: 30rpx;
    margin-right: 12rpx;
    transition: all 0.25s;

    &.active {
      opacity: 1;
      background: rgba(255, 255, 255, 0.3);
      font-weight: 600;
    }
  }
}

.pet-list {
  flex: 1;
  padding: 16rpx 20rpx 120rpx;
}

.quick-nav {
  display: flex;
  justify-content: space-around;
  padding: 24rpx 0;
  background: #fff;
  margin: 0 20rpx 16rpx;
  border-radius: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
}

.nav-icon {
  font-size: 40rpx;
}

.nav-label {
  font-size: 22rpx;
  color: #666;
}

.pet-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.pet-card {
  width: calc(50% - 10rpx);
  background: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.pet-cover {
  width: 100%;
  height: 300rpx;
  background: #fef3c7;
}

.pet-info {
  padding: 16rpx;
}

.pet-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.pet-meta {
  display: block;
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.pet-city {
  display: block;
  font-size: 22rpx;
  color: #f59e0b;
  margin-top: 4rpx;
}

.float-btn {
  position: fixed;
  right: 40rpx;
  bottom: 200rpx;
  width: 100rpx;
  height: 100rpx;
  background: #f59e0b;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(245, 158, 11, 0.4);
  z-index: 10;
}

.loading-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 200rpx 0;
  color: #999;
  gap: 16rpx;
}

.empty-wrap {
  padding-top: 200rpx;
}
</style>
