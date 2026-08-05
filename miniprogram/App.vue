<script>
export default {
  onLaunch() {
    console.log('[Homeward Paw] App Launch')
  },
  onShow() {
    console.log('[Homeward Paw] App Show')
  },
  onHide() {
    console.log('[Homeward Paw] App Hide')
  }
}
</script>

<style lang="scss">
/* 全局公共样式 */
page {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC',
    'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 28rpx;
  color: #333;
  background: #f5f5f5;
}

/* uView Plus 主题色覆盖 */
:root {
  --u-warning: #f59e0b;
  --u-primary: #f59e0b;
}
</style>
