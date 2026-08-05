<template>
  <view class="container">
    <view class="hero">
      <text class="hero-title">救助知识</text>
      <text class="hero-desc">科学养宠，让爱更有力量</text>
    </view>

    <view class="search-row">
      <picker mode="selector" :range="categoryList" range-key="label" @change="onCategoryChange">
        <view class="picker-box">{{ currentCategory.label }}</view>
      </picker>
      <view class="search-input-wrap">
        <input v-model="keyword" placeholder="搜索文章..." @confirm="onSearch" />
      </view>
      <button class="btn-search" @tap="onSearch">搜索</button>
    </view>

    <view class="article-list">
      <view v-for="item in articles" :key="item.id" class="article-card" @tap="goDetail(item.id)">
        <view class="card-img-wrap">
          <image v-if="item.cover_image" :src="item.cover_image" mode="aspectFill" class="card-img" />
          <text v-else class="card-img-placeholder">📖</text>
        </view>
        <view class="card-body">
          <text class="card-cat">{{ categoryMap[item.category] || item.category }}</text>
          <text class="card-title">{{ item.title }}</text>
          <text class="card-summary">{{ item.summary || '阅读全文 →' }}</text>
          <text class="card-views">👁 {{ item.view_count }} 次阅读</text>
        </view>
      </view>
    </view>

    <view v-if="totalPages > 1" class="pagination">
      <button :disabled="page <= 1" @tap="prevPage">上一页</button>
      <text>{{ page }} / {{ totalPages }}</text>
      <button :disabled="page >= totalPages" @tap="nextPage">下一页</button>
    </view>

    <view v-if="!loading && articles.length === 0" class="empty-text">暂无文章</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { knowledgeApi } from '@/api/index.js'

const PAGE_SIZE = 10
const page = ref(1)
const keyword = ref('')
const category = ref('')
const articles = ref([])
const total = ref(0)
const loading = ref(true)

const categoryMap = { care: '日常护理', medical: '医疗健康', law: '法规政策', story: '救助故事' }
const categoryList = [{ label: '全部分类', value: '' }, 
  ...Object.entries(categoryMap).map(([k, v]) => ({ label: v, value: k }))]

const currentCategory = computed(() => {
  return categoryList.find(c => c.value === category.value) || categoryList[0]
})

const totalPages = computed(() => Math.ceil(total.value / PAGE_SIZE))

function onCategoryChange(e) {
  category.value = categoryList[e.detail.value].value
  page.value = 1
  fetchData()
}

function onSearch() {
  page.value = 1
  fetchData()
}

function prevPage() { page.value--; fetchData() }
function nextPage() { page.value++; fetchData() }

async function fetchData() {
  loading.value = true
  try {
    const res = await knowledgeApi.list({ page: page.value, page_size: PAGE_SIZE, category: category.value, keyword: keyword.value })
    articles.value = res.data.items
    total.value = res.data.total
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  uni.navigateTo({ url: `/pages-knowledge/detail/detail?id=${id}` })
}

onMounted(fetchData)
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.hero { text-align: center; padding: 40rpx 0 30rpx; }
.hero-title { font-size: 40rpx; font-weight: 700; display: block; }
.hero-desc { font-size: 28rpx; color: #999; margin-top: 10rpx; display: block; }
.search-row { display: flex; gap: 12rpx; margin-bottom: 24rpx; align-items: center; }
.picker-box { background: #fff; padding: 16rpx 20rpx; border-radius: 12rpx; border: 2rpx solid #eee; font-size: 28rpx; min-width: 160rpx; text-align: center; }
.search-input-wrap { flex: 1; }
.search-input-wrap input { background: #fff; padding: 16rpx 20rpx; border-radius: 12rpx; border: 2rpx solid #eee; font-size: 28rpx; width: 100%; box-sizing: border-box; }
.btn-search { background: #f59e0b; color: #fff; padding: 12rpx 30rpx; border-radius: 12rpx; font-size: 28rpx; border: none; line-height: 1.4; }
.article-list { display: flex; flex-direction: column; gap: 20rpx; }
.article-card { background: #fff; border-radius: 16rpx; overflow: hidden; box-shadow: 0 2rpx 12rpx rgba(0,0,0,0.06); }
.card-img-wrap { height: 240rpx; background: #fef3c7; display: flex; align-items: center; justify-content: center; }
.card-img { width: 100%; height: 100%; }
.card-img-placeholder { font-size: 80rpx; }
.card-body { padding: 20rpx; }
.card-cat { color: #d97706; font-size: 22rpx; font-weight: 600; }
.card-title { font-size: 30rpx; font-weight: 600; margin: 8rpx 0; display: block; }
.card-summary { font-size: 26rpx; color: #78716c; display: block; }
.card-views { font-size: 22rpx; color: #d97706; margin-top: 8rpx; display: block; }
.pagination { display: flex; justify-content: center; align-items: center; gap: 30rpx; margin-top: 40rpx; }
.pagination button { padding: 10rpx 30rpx; border: 1rpx solid #eee; background: #fff; border-radius: 12rpx; font-size: 26rpx; }
.pagination text { font-size: 26rpx; color: #999; }
.empty-text { text-align: center; padding: 120rpx 0; color: #999; font-size: 28rpx; }
</style>
