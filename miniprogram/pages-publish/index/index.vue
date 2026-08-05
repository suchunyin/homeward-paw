<template>
  <view class="page-publish">
    <view class="form-card">
      <text class="form-title">发布领养信息</text>

      <u-form label-width="120rpx" label-position="left">
        <u-form-item label="宠物名称" required>
          <u-input v-model="form.name" placeholder="请输入" border="bottom" />
        </u-form-item>

        <u-form-item label="物种" required>
          <u-radio-group v-model="form.species" placement="row">
            <u-radio v-for="s in speciesOptions" :key="s" :label="s" :name="s" />
          </u-radio-group>
        </u-form-item>

        <u-form-item label="品种">
          <u-input v-model="form.breed" placeholder="如：金毛、橘猫" border="bottom" />
        </u-form-item>

        <u-form-item label="月龄">
          <u-input v-model="form.age" type="number" placeholder="0" border="bottom" />
        </u-form-item>

        <u-form-item label="性别">
          <u-radio-group v-model="form.gender" placement="row">
            <u-radio label="公" name="male" />
            <u-radio label="母" name="female" />
            <u-radio label="未知" name="unknown" />
          </u-radio-group>
        </u-form-item>

        <u-form-item label="体型">
          <u-radio-group v-model="form.size" placement="row">
            <u-radio label="小型" name="small" />
            <u-radio label="中型" name="medium" />
            <u-radio label="大型" name="large" />
          </u-radio-group>
        </u-form-item>

        <u-form-item label="所在城市">
          <u-input v-model="form.city" placeholder="请输入" border="bottom" />
        </u-form-item>

        <u-form-item label="所在区域">
          <u-input v-model="form.district" placeholder="请输入" border="bottom" />
        </u-form-item>

        <u-form-item label="健康状况">
          <u-textarea
            v-model="form.health_status"
            placeholder="疫苗接种、驱虫等情况"
            maxlength="200"
          />
        </u-form-item>

        <u-form-item label="已接种疫苗">
          <u-switch v-model="form.is_vaccinated" active-color="#f59e0b" />
        </u-form-item>

        <u-form-item label="已绝育">
          <u-switch v-model="form.is_neutered" active-color="#f59e0b" />
        </u-form-item>

        <u-form-item label="简介">
          <u-textarea
            v-model="form.description"
            placeholder="描述宠物的性格、习惯等"
            maxlength="500"
          />
        </u-form-item>
      </u-form>

      <u-button
        type="warning"
        text="发布"
        shape="circle"
        :loading="loading"
        @click="onSubmit"
      />
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { petApi } from '@/api/index.js'

const speciesOptions = ['狗', '猫', '其他']

const form = reactive({
  name: '',
  species: '狗',
  breed: '',
  age: 0,
  gender: 'unknown',
  size: 'medium',
  city: '',
  district: '',
  health_status: '',
  is_vaccinated: false,
  is_neutered: false,
  description: ''
})

const loading = ref(false)

async function onSubmit() {
  if (!form.name.trim()) {
    uni.showToast({ title: '请输入宠物名称', icon: 'none' })
    return
  }

  // 转换 age 为数字
  const data = { ...form, age: Number(form.age) || 0 }

  loading.value = true
  try {
    await petApi.create(data)
    uni.showToast({ title: '发布成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1000)
  } catch (e) {
    uni.showToast({
      title: e.data?.detail || '发布失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.page-publish {
  background: #f5f5f5;
  min-height: 100vh;
  padding: 24rpx;
}

.form-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 32rpx 24rpx;
}

.form-title {
  display: block;
  font-size: 34rpx;
  font-weight: 700;
  color: #333;
  text-align: center;
  margin-bottom: 32rpx;
}
</style>
