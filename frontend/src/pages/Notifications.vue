<template>
  <div class="page-container">
    <van-nav-bar title="到货提醒" left-arrow @click-left="router.back">
      <template #right>
        <span v-if="notifications.some((n) => !n.isRead)" class="read-all" @click="onMarkAllRead">
          全部已读
        </span>
      </template>
    </van-nav-bar>

    <van-pull-refresh v-model="refreshing" @refresh="onRefresh">
      <van-loading v-if="loading" class="loading-center" />

      <div v-else-if="notifications.length > 0" class="notify-list">
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notify-item"
          :class="{ unread: !item.isRead }"
          @click="onOpenNotification(item)"
        >
          <div class="notify-dot">
            <span v-if="!item.isRead" class="unread-dot"></span>
            <van-icon v-else name="bell" size="20" color="#bbb" />
          </div>
          <div class="notify-body">
            <div class="notify-title">
              你求购的《{{ item.book?.title || item.request?.bookTitle || '书籍' }}》到货了
            </div>
            <div class="notify-desc">
              <template v-if="item.book">
                <span class="price" v-if="item.book.price != null">¥{{ item.book.price }}</span>
                <span v-if="item.book.campus"> · {{ item.book.campus }}校区</span>
                <span v-if="item.book.author"> · {{ item.book.author }}</span>
              </template>
              <span v-else>关联书籍已下架或删除</span>
            </div>
            <div class="notify-time">{{ formatTime(item.createdAt) }}</div>
          </div>
          <van-icon name="arrow" color="#c8c9cc" />
        </div>
      </div>

      <van-empty v-else description="暂无到货提醒" />
    </van-pull-refresh>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notification';
import type { ArrivalNotification } from '@/types';

const router = useRouter();
const loading = ref(true);
const refreshing = ref(false);
const notifications = ref<ArrivalNotification[]>([]);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    notifications.value = await getMyNotifications();
  } finally {
    loading.value = false;
  }
};

const onRefresh = async () => {
  try {
    notifications.value = await getMyNotifications();
  } finally {
    refreshing.value = false;
  }
};

const onOpenNotification = async (item: ArrivalNotification) => {
  // 打开前先把未读标记为已读
  if (!item.isRead) {
    try {
      await markNotificationRead(item.id);
      item.isRead = true;
    } catch {
      // 标记失败仍允许跳转
    }
  }

  if (item.bookId) {
    router.push(`/book/${item.bookId}`);
  } else {
    showToast('关联书籍已下架或删除');
  }
};

const onMarkAllRead = async () => {
  try {
    await markAllNotificationsRead();
    notifications.value.forEach((n) => (n.isRead = true));
    showToast('已全部标记为已读');
  } catch {}
};

const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 60 * 1000) return '刚刚';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 24 * 60 * 60 * 1000) {
    return `${date.getHours().toString().padStart(2, '0')}:${date
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

fetchNotifications();
</script>

<style scoped>
.read-all {
  color: #1989fa;
  font-size: 13px;
}
.loading-center {
  display: flex;
  justify-content: center;
  padding: 100px;
}
.notify-list {
  background: white;
}
.notify-item {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}
.notify-item.unread {
  background: #f0f8ff;
}
.notify-dot {
  width: 24px;
  display: flex;
  justify-content: center;
  margin-right: 12px;
}
.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ee0a24;
  display: inline-block;
}
.notify-body {
  flex: 1;
  overflow: hidden;
}
.notify-title {
  font-size: 15px;
  font-weight: 500;
  color: #1a1a1a;
}
.notify-item.unread .notify-title {
  color: #1989fa;
}
.notify-desc {
  font-size: 13px;
  color: #666;
  margin-top: 4px;
}
.notify-desc .price {
  color: #ff4d4f;
}
.notify-time {
  font-size: 12px;
  color: #999;
  margin-top: 6px;
}
</style>
