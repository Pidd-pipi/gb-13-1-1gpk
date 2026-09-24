<template>
  <div class="purchase-card">
    <div class="purchase-header">
      <div class="purchase-title">{{ request.bookTitle }}</div>
      <van-tag v-if="request.status === 'active'" type="primary">求购中</van-tag>
      <van-tag v-else type="default">已关闭</van-tag>
    </div>
    <div class="purchase-meta" v-if="request.author">
      <span>作者：{{ request.author }}</span>
    </div>
    <div class="purchase-meta" v-if="request.expectedPrice">
      <span class="price">期望价格：¥{{ request.expectedPrice }}</span>
    </div>
    <div class="purchase-meta" v-if="request.conditions?.length">
      <span>新旧要求：{{ request.conditions.join('、') }}</span>
    </div>
    <div class="purchase-footer">
      <span>{{ categoryMap[request.category] }} · {{ request.campus }}</span>
      <div class="requester" v-if="request.requester">
        <van-icon name="user-o" size="12" />
        <span>{{ request.requester.name || request.requester.department || '匿名' }}</span>
      </div>
    </div>
    <div
      v-if="canSubscribe"
      class="purchase-actions"
    >
      <van-button
        size="small"
        round
        :type="subscribed ? 'warning' : 'default'"
        :icon="subscribed ? 'bell' : 'bell-o'"
        :loading="submitting"
        @click="onToggleSubscribe"
      >
        {{ subscribed ? '已订阅到货提醒' : '到货提醒' }}
      </van-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import type { PurchaseRequest } from '@/types';
import { categoryMap } from '@/types';
import { subscribeRequest, unsubscribeRequest } from '@/api/purchase';
import { useAuthStore } from '@/store/auth';

const props = defineProps<{
  request: PurchaseRequest;
  subscribed?: boolean;
}>();

const router = useRouter();
const authStore = useAuthStore();

const innerSubscribed = ref(!!props.subscribed);
const submitting = ref(false);

// 仅登录用户、求购开放中、且不是求购发布者本人时展示订阅入口
const canSubscribe = computed(
  () =>
    authStore.isAuthenticated &&
    props.request.status === 'active' &&
    props.request.requesterId !== authStore.user?.id
);

const onToggleSubscribe = async () => {
  if (!authStore.isAuthenticated) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
    return;
  }

  try {
    if (innerSubscribed.value) {
      await showConfirmDialog({
        title: '退订到货提醒',
        message: `退订后将不再收到《${props.request.bookTitle}》的到货通知，确定退订吗？`,
        confirmButtonText: '退订',
      });
      submitting.value = true;
      await unsubscribeRequest(props.request.id);
      innerSubscribed.value = false;
      showToast('已退订');
    } else {
      submitting.value = true;
      await subscribeRequest(props.request.id);
      innerSubscribed.value = true;
      showToast('订阅成功，到货后通知你');
    }
  } catch {
    // 用户取消确认弹窗或请求失败，提示已由拦截器处理
  } finally {
    submitting.value = false;
  }
};
</script>

<style scoped>
.purchase-card {
  background: white;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}
.purchase-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.purchase-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
  flex: 1;
  margin-right: 8px;
}
.purchase-meta {
  font-size: 13px;
  color: #666;
  margin-top: 8px;
}
.purchase-meta .price {
  color: #ff4d4f;
}
.purchase-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  font-size: 12px;
  color: #999;
}
.requester {
  display: flex;
  align-items: center;
  gap: 4px;
}
.purchase-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}
</style>
