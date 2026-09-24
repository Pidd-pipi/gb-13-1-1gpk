<template>
  <div class="page-container">
    <van-nav-bar title="到货提醒" left-arrow @click-left="router.back">
      <template #right>
        <span class="read-all" v-if="notifications.some((item) => !item.isRead)" @click="readAll">
          全部已读
        </span>
      </template>
    </van-nav-bar>

    <van-tabs v-model:active="activeTab" sticky @change="fetchNotifications">
      <van-tab title="全部" name="all" />
      <van-tab title="未读" name="unread" />
    </van-tabs>

    <div class="notification-list">
      <van-loading v-if="loading" class="loading-center" />
      <template v-else>
        <div
          v-for="item in notifications"
          :key="item.id"
          class="notification-item"
          :class="{ unread: !item.isRead }"
          @click="openNotification(item)"
        >
          <div class="notification-main">
            <div class="notification-dot" v-if="!item.isRead"></div>
            <div class="notification-body">
              <div class="notification-content">{{ item.content }}</div>
              <div class="notification-meta">
                <span>{{ formatTime(item.createdAt) }}</span>
                <van-tag v-if="item.request?.status === 'closed'" plain type="default">求购已关闭</van-tag>
              </div>
            </div>
          </div>
          <van-icon
            v-if="!item.isRead"
            name="check"
            class="read-icon"
            title="标记已读"
            @click.stop="markRead(item)"
          />
        </div>
        <van-empty v-if="notifications.length === 0" :description="activeTab === 'unread' ? '没有未读提醒' : '暂无到货提醒'" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '@/api/notification';
import type { StockNotification } from '@/types';

const router = useRouter();
const activeTab = ref<'all' | 'unread'>('all');
const loading = ref(false);
const notifications = ref<StockNotification[]>([]);

const fetchNotifications = async () => {
  loading.value = true;
  try {
    notifications.value = await getNotifications(
      activeTab.value === 'unread' ? { unreadOnly: true } : undefined
    );
  } finally {
    loading.value = false;
  }
};

const markRead = async (item: StockNotification) => {
  if (item.isRead) return;
  try {
    await markNotificationRead(item.id);
    item.isRead = true;
    showToast('已标记为已读');
    if (activeTab.value === 'unread') {
      notifications.value = notifications.value.filter((notification) => notification.id !== item.id);
    }
  } catch {}
};

const readAll = async () => {
  try {
    await markAllNotificationsRead();
    notifications.value.forEach((item) => {
      item.isRead = true;
    });
    if (activeTab.value === 'unread') {
      notifications.value = [];
    }
    showToast('全部已标记为已读');
  } catch {}
};

// 打开关联书籍，同时把该条提醒标记为已读
const openNotification = async (item: StockNotification) => {
  if (!item.bookId) {
    showToast('关联书籍已被删除');
    return;
  }
  if (!item.isRead) {
    try {
      await markNotificationRead(item.id);
      item.isRead = true;
    } catch {}
  }
  router.push(`/book/${item.bookId}`);
};

const formatTime = (time: string) => {
  const date = new Date(time);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < 24 * 60 * 60 * 1000) {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

onMounted(fetchNotifications);
</script>

<style scoped>
.read-all {
  color: #1989fa;
  font-size: 14px;
}
.notification-list {
  padding: 12px;
}
.loading-center {
  display: flex;
  justify-content: center;
  padding: 100px;
}
.notification-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: white;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 10px;
}
.notification-item.unread {
  background: #f0f7ff;
}
.notification-main {
  display: flex;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}
.notification-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #ee0a24;
  margin-top: 6px;
  margin-right: 8px;
  flex-shrink: 0;
}
.notification-body {
  flex: 1;
  min-width: 0;
}
.notification-content {
  font-size: 14px;
  color: #1a1a1a;
  line-height: 1.5;
}
.notification-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}
.read-icon {
  font-size: 18px;
  color: #1989fa;
  padding: 4px 8px;
  flex-shrink: 0;
}
</style>
