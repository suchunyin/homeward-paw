<template>
  <view class="page-list">
    <!-- 筛选 -->
    <view class="filter-bar">
      <u-search
        v-model="keyword"
        placeholder="搜索宠物"
        shape="round"
        :show-action="true"
        action-text="搜索"
        @search="onSearch"
        @custom="onSearch"
      />
      <scroll-view scroll-x class="filter-tabs">
        <view
          v-for="s in speciesList"
          :key="s.value"
          class="filter-item"
          :class="{ active: species === s.value }"
          @tap="onSpeciesChange(s.value)"
        >
          {{ s.label }}
        </view>
      </scroll-view>
    </view>

    <!-- 列表 -->
    <view v-if="loading && pets.length === 0" class="center-wrap">
      <u-loading-icon />
    </view>

    <view v-else-if="pets.length === 0" class="center-wrap">
      <u-empty text="没有找到宠物" mode="search" />
    </view>

    <scroll-view
      v-else
      scroll-y
      class="list-scroll"
      @scrolltolower="onLoadMore"
    >
      <view
        v-for="pet in pets"
        :key="pet.id"
        class="pet-row"
        @tap="goDetail(pet.id)"
      >
        <image
          :src="pet.cover_image || '/static/default-pet.png'"
          mode="aspectFill"
          class="row-cover"
        />
        <view class="row-info">
          <text class="row-name">{{ pet.name }}</text>
          <text class="row-meta">
            {{ pet.breed || pet.species }} · {{ pet.age }}个月
            {{ pet.gender === 'male' ? '♂' : pet.gender === 'female' ? '♀' : '' }}
          </text>
          <text class="row-desc" v-if="pet.description">
            {{ pet.description.slice(0, 40) }}{{ pet.description.length > 40 ? '...' : '' }}
          </text>
          <text class="row-city">{{ pet.city || '未知城市' }}</text>
        </view>
        <u-icon name="arrow-right" color="#ccc" size="18" />
      </view>

      <u-loadmore :status="loadStatus" />
    </scroll-view>
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

const speciesList = [
  { label: '全部', value: '' },
  { label: '狗狗', value: '狗' },
  { label: '猫咪', value: '猫' },
  { label: '其他', value: '其他' }
]

const loadStatus = computed(() => {
  if (loading.value) return 'loading'
  if (pets.value.length >= total.value) return 'nomore'
  return 'loadmore'
})

async function fetchPets(isRefresh = false) {
  if (loading.value) return
  loading.value = true
  if (isRefresh) page.value = 1

  try {
    const params = { page: page.value, page_size: 12 }
    if (species.value) params.species = species.value
    if (keyword.value) params.keyword = keyword.value

    const res = await petApi.list(params)
    const { items, total: t } = res.data
    pets.value = isRefresh ? items : [...pets.value, ...items]
    total.value = t
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

function onSearch() {
  fetchPets(true)
}

function onSpeciesChange(val) {
  species.value = val
  fetchPets(true)
}

function onLoadMore() {
  if (!loading.value && pets.value.length < total.value) {
    page.value++
    fetchPets()
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages-pet/detail/detail?id=${id}` })
}

onMounted(() => {
  fetchPets(true)
})
</script>

<style lang="scss" scoped>
.page-list {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #f5f5f5;
}

.filter-bar {
  background: #fff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #eee;
}

.filter-tabs {
  white-space: nowrap;
  margin-top: 16rpx;
  display: flex;

  .filter-item {
    display: inline-block;
    padding: 8rpx 28rpx;
    font-size: 26rpx;
    background: #f5f5f5;
    border-radius: 30rpx;
    margin-right: 12rpx;
    color: #666;

    &.active {
      background: #fef3c7;
      color: #f59e0b;
      font-weight: 600;
    }
  }
}

.list-scroll {
  flex: 1;
  padding: 16rpx 24rpx;
}

.pet-row {
  display: flex;
  align-items: center;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.row-cover {
  width: 140rpx;
  height: 140rpx;
  border-radius: 12rpx;
  background: #fef3c7;
  flex-shrink: 0;
}

.row-info {
  flex: 1;
  margin-left: 20rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.row-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.row-meta {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
}

.row-desc {
  font-size: 24rpx;
  color: #666;
  margin-top: 6rpx;
  line-height: 1.4;
}

.row-city {
  font-size: 22rpx;
  color: #f59e0b;
  margin-top: 4rpx;
}

.center-wrap {
  display: flex;
  justify-content: center;
  padding-top: 300rpx;
}
</style>
