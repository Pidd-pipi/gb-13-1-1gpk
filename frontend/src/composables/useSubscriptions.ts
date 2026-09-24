import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { getMySubscriptions, subscribeRequest, unsubscribeRequest } from '@/api/purchase';
import { useAuthStore } from '@/store/auth';
import type { PurchaseRequest } from '@/types';

/** 到货提醒订阅状态与订阅/退订操作 */
export const useSubscriptions = () => {
  const router = useRouter();
  const authStore = useAuthStore();

  const subscribedIds = ref<Set<string>>(new Set());
  const togglingId = ref<string | null>(null);

  const fetchSubscriptions = async () => {
    if (!authStore.isAuthenticated) {
      subscribedIds.value = new Set();
      return;
    }
    try {
      const subscriptions = await getMySubscriptions();
      subscribedIds.value = new Set(subscriptions.map((item) => item.requestId));
    } catch {
      subscribedIds.value = new Set();
    }
  };

  const toggleSubscription = async (item: PurchaseRequest) => {
    if (!authStore.isAuthenticated) {
      router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } });
      return;
    }

    togglingId.value = item.id;
    try {
      if (subscribedIds.value.has(item.id)) {
        await unsubscribeRequest(item.id);
        subscribedIds.value.delete(item.id);
        showToast('已取消订阅');
      } else {
        await subscribeRequest(item.id);
        subscribedIds.value.add(item.id);
        showToast('订阅成功，到货后第一时间提醒你');
      }
      subscribedIds.value = new Set(subscribedIds.value);
    } catch {
    } finally {
      togglingId.value = null;
    }
  };

  return {
    subscribedIds,
    togglingId,
    fetchSubscriptions,
    toggleSubscription,
  };
};
