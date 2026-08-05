<template>
  <view class="container" v-if="article">
    <view class="header">
      <text class="category-tag">{{ categoryMap[article.category] || article.category }}</text>
    </view>
    <text class="title">{{ article.title }}</text>
    <view class="meta">
      <text>发布于 {{ formatDate(article.created_at) }}</text>
      <text> · 👁 {{ article.view_count }} 次阅读</text>
    </view>
    <view class="content">
      <text>{{ article.content }}</text>
    </view>
  </view>
  <view v-else-if="loading" class="empty-text">加载中...</view>
  <view v-else class="empty-text">文章不存在</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { knowledgeApi } from '@/api/index.js'

const props = defineProps({})
const query = getCurrentPages()

const id = ref(0)
const article = ref(null)
const loading = ref(true)

const categoryMap = { care: '日常护理', medical: '医疗健康', law: '法规政策', story: '救助故事' }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('zh-CN')
}

onMounted(() => {
  const instance = getCurrentPages()
  const options = instance[instance.length - 1].options || instance[instance.length - 1].$route?.query || {}
  id.value = Number(options.id || 0)
  if (id.value) {
    knowledgeApi.detail(id.value).then(res => {
      article.value = res.data
    }).finally(() => loading.value = false)
  }
})
</script>

<style scoped>
.container { padding: 20rpx 30rpx; }
.header { margin-bottom: 16rpx; }
.category-tag { background: #fef3c7; color: #d97706; padding: 6rpx 24rpx; border-radius: 20rpx; font-size: 24rpx; }
.title { font-size: 40rpx; font-weight: 700; display: block; margin-bottom: 16rpx; }
.meta { font-size: 24rpx; color: #999; margin-bottom: 32rpx; }
.content { font-size: 30rpx; line-height: 2; white-space: pre-wrap; }
.empty-text { text-align: center; padding: 200rpx 0; color: #999; font-size: 28rpx; }
</style>
