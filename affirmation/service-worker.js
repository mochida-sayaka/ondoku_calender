// Service Worker バージョン
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `affirmation-calendar-${CACHE_VERSION}`;

// キャッシュするファイル
const urlsToCache = [
  '/ondoku_calender/affirmation/',
  '/ondoku_calender/affirmation/index.html',
  '/ondoku_calender/affirmation/css/base.css',
  '/ondoku_calender/affirmation/css/screens.css',
  '/ondoku_calender/affirmation/css/animations.css',
  '/ondoku_calender/affirmation/css/stats.css',
  '/ondoku_calender/affirmation/js/main.js',
  '/ondoku_calender/affirmation/js/theme.js',
  '/ondoku_calender/affirmation/js/firebase-config.js',
  '/ondoku_calender/affirmation/js/firebase-service.js',
  '/ondoku_calender/affirmation/js/utils.js',
  '/ondoku_calender/affirmation/js/calendar.js',
  '/ondoku_calender/affirmation/js/affirmation.js',
  '/ondoku_calender/affirmation/js/animations.js',
  '/ondoku_calender/affirmation/js/modals.js',
  '/ondoku_calender/affirmation/js/share.js',
  '/ondoku_calender/affirmation/js/stats.js'
];

// インストール時
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: インストール中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 キャッシュを作成');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// アクティベート時（古いキャッシュを削除）
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: アクティベート');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 古いキャッシュを削除:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// フェッチ時（キャッシュ優先）
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// 通知クリック時
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 通知がクリックされました');
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/ondoku_calender/affirmation/')
  );
});

// バックグラウンド同期（オプション）
self.addEventListener('sync', (event) => {
  console.log('🔄 バックグラウンド同期:', event.tag);
  if (event.tag === 'sync-recordings') {
    event.waitUntil(syncRecordings());
  }
});

// 録音データの同期処理
async function syncRecordings() {
  // 将来的に実装：オフライン時の録音をアップロード
  console.log('📤 録音データを同期');
}

// ==============================================
// 定期通知機能
// ==============================================

// メッセージ受信時（main.jsから送信される）
self.addEventListener('message', (event) => {
  console.log('📩 Service Workerがメッセージ受信:', event.data);
  
  if (event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { time, theme } = event.data;
    scheduleNotificationInSW(time, theme);
  }
  
  if (event.data.type === 'SEND_TEST_NOTIFICATION') {
    const { theme } = event.data;
    sendNotificationFromSW(theme);
  }
});

// 通知をスケジュール
function scheduleNotificationInSW(time, theme) {
  const [hours, minutes] = time.split(':');
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // 今日の指定時刻を過ぎていたら明日に設定
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const delay = scheduledTime - now;
  
  console.log(`⏰ Service Workerで通知をスケジュール: ${scheduledTime.toLocaleString()}`);
  
  // タイマー設定
  setTimeout(() => {
    sendNotificationFromSW(theme);
    // 翌日も通知
    scheduleNotificationInSW(time, theme);
  }, delay);
}

// 通知を送信
function sendNotificationFromSW(theme) {
  const emoji = theme?.emoji || '🔮';
  const name = theme?.name || 'ミスティック・タロット';
  
  self.registration.showNotification(`${emoji} 今日の音読時間です！`, {
    body: '今日のアファメーションを音読しましょう 🎤',
    tag: 'daily-affirmation',
    requireInteraction: false,
    badge: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y="0.9em" font-size="90">🔮</text></svg>',
    data: {
      url: '/ondoku_calender/affirmation/'
    }
  });
  
  console.log('🔔 通知を送信しました');
}