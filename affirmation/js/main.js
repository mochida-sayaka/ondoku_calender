// グローバル状態
window.appState = {
  studentName: null,
  selectedMood: null,
  selectedLevel: null,
  selectedCount: null,
  weeklyData: null,
  currentDayIndex: null,
  currentAffirmationIndex: 0,
  recordings: [],
  isRecording: false,
  mediaRecorder: null,
  audioChunks: [],
  recordingMimeType: 'audio/webm' // ← 追加
};

// アプリケーション初期化
document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 アプリケーション起動');
  
  // Firebaseを初期化
  const { db: database, storage: storageInstance, auth: authInstance } = window.initFirebase();
  window.db = database;
  window.storage = storageInstance;
  window.auth = authInstance;

  // 最初は全画面を非表示
  document.querySelectorAll('.screen').forEach(screen => {
    screen.style.display = 'none';
  });
  
  // 認証状態を監視
  window.observeAuthState(async (user) => {
    if (user) {
      console.log('✅ ログイン済み:', user.displayName);
      
      // ユーザー固有のデータを読み込み
      await loadUserData(user.uid);
      
      // 週データがあるかチェック
      if (window.appState.weeklyData) {
        // 週が終了しているかチェック
        const today = new Date().toISOString().split('T')[0];
        const weekEnd = window.appState.weeklyData.weekEndDate;
        
        if (today <= weekEnd) {
          // 週がまだ続いているのでカレンダーを表示
          showCalendar();
        } else {
          // 週が終了した！サマリーを表示
          window.showWeekSummary();
        }
      } else {
        // 初回起動
        showSetupScreen();
      }
      
      // 通知設定を読み込み
      loadNotificationSettings();
    } else {
      console.log('❌ 未ログイン');
      // ログイン画面を表示
      showLoginScreen();
    }
  });
  
  // イベントリスナーを設定
  setupEventListeners();
  
  console.log('✅ 初期化完了');
});

// 全選択チェック→ボタンを光らせる
function checkAllSelected() {
  const nameInput = document.getElementById('studentNameInput').value.trim();
  const allSelected = nameInput && 
                      window.appState.selectedMood && 
                      window.appState.selectedLevel && 
                      window.appState.selectedCount;
  
  const button = document.getElementById('drawCardsBtn');
  if (allSelected) {
    button.classList.add('ready');
  } else {
    button.classList.remove('ready');
  }
}

// 名前入力
document.getElementById('studentNameInput').addEventListener('input', () => {
  checkAllSelected();
});

// ==============================================
// ユーザーデータ管理
// ==============================================

/**
 * ユーザーデータを読み込み
 */
async function loadUserData(uid) {
  try {
    // Firestoreからユーザーの週データを取得
    const weekDataRef = window.doc(window.db, 'users', uid, 'weekData', 'current');
    const weekDataSnap = await window.getDoc(weekDataRef);
    
    if (weekDataSnap.exists()) {
      const data = weekDataSnap.data();
      window.appState.weeklyData = data;
      window.appState.studentName = data.studentName || window.getCurrentUser().displayName;
      console.log('✅ ユーザーデータ読み込み成功');
    } else {
      console.log('📝 新規ユーザー：データなし');
      window.appState.studentName = window.getCurrentUser().displayName;
    }
  } catch (error) {
    console.error('❌ ユーザーデータ読み込みエラー:', error);
  }
}

/**
 * ユーザーデータを保存
 */
async function saveUserData(uid, data) {
  try {
    const weekDataRef = window.doc(window.db, 'users', uid, 'weekData', 'current');
    await window.setDoc(weekDataRef, data, { merge: true });
    console.log('✅ ユーザーデータ保存成功');
  } catch (error) {
    console.error('❌ ユーザーデータ保存エラー:', error);
    throw error;
  }
}

// グローバルに公開
window.loadUserData = loadUserData;
window.saveUserData = saveUserData;

// イベントリスナー設定
function setupEventListeners() {
  // ログイン画面
  document.getElementById('googleLoginBtn')?.addEventListener('click', loginWithGoogle);
  
  // 設定画面
  setupMoodSelection();
  setupLevelSelection();
  setupCountSelection();
  document.getElementById('drawCardsBtn').addEventListener('click', handleDrawCards);
  
  // カレンダー画面
  document.getElementById('prevMonthBtn')?.addEventListener('click', window.goToPrevMonth);
  document.getElementById('nextMonthBtn')?.addEventListener('click', window.goToNextMonth);
  document.getElementById('todayBtn')?.addEventListener('click', window.goToThisMonth); // ← 追加
  document.getElementById('statsBtn').addEventListener('click', showStatsScreen);
  document.getElementById('settingsBtn').addEventListener('click', () => {
    document.getElementById('settingsModal').style.display = 'flex';
  });
  document.getElementById('logoutBtn').addEventListener('click', window.logout);
  
  // アファメーション画面
  document.getElementById('backBtn').addEventListener('click', showCalendar);
  document.getElementById('toggleJapanese').addEventListener('click', toggleJapanese);
  document.getElementById('playModelBtn').addEventListener('click', playModelAudio);
  document.getElementById('recordBtn').addEventListener('click', handleRecord);
  document.getElementById('completeBtn').addEventListener('click', handleComplete);
  
    // 設定モーダルを閉じる
    document.getElementById('closeSettingsModalBtn').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
    });
    
    // アコーディオンの開閉
    document.querySelectorAll('.accordion-header').forEach(header => {
        header.addEventListener('click', () => {
        const targetId = header.dataset.target;
        const content = document.getElementById(targetId);
        
        // 開閉トグル
        header.classList.toggle('active');
        content.classList.toggle('open');
        });
    });
    
    // テーマ選択
    document.querySelectorAll('.theme-btn').forEach(btn => {
        btn.addEventListener('click', () => {
        // すべてのボタンからactiveを削除
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        // クリックされたボタンにactiveを追加
        btn.classList.add('active');
        // テーマを適用
        const themeId = btn.dataset.theme;
        window.applyTheme(themeId);
        });
    });
    
    // 通知トグル
    document.getElementById('notificationToggle').addEventListener('change', (e) => {
        const timeSetting = document.getElementById('timeSetting');
        if (e.target.checked) {
        timeSetting.style.display = 'flex';
        requestNotificationPermission();
        } else {
        timeSetting.style.display = 'none';
        disableNotifications();
        }
    });
    
    // 通知時刻の変更
    document.getElementById('notificationTime').addEventListener('change', (e) => {
        saveNotificationTime(e.target.value);
        scheduleNotification(e.target.value);
    });
    
    // カレンダーリセット
    document.getElementById('resetCalendarBtn').addEventListener('click', handleResetSettings);

  // 統計画面
  document.getElementById('backToCalendarBtn').addEventListener('click', showCalendar);
  
  // 完了サマリーモーダル
  document.getElementById('closeCompletionSummaryBtn')?.addEventListener('click', window.closeCompletionSummary);
  document.getElementById('shareBtn')?.addEventListener('click', window.openShareModalFromCompletion);
  
  // シェアモーダル
  document.getElementById('closeShareModalBtn')?.addEventListener('click', window.closeShareModal);
  document.getElementById('downloadImageBtn')?.addEventListener('click', async () => {
    const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
    await window.downloadAffirmationImage(day.affirmations);
  });
  document.getElementById('closeShareAndReturnBtn')?.addEventListener('click', () => {
    window.closeShareModal();
    window.closeCompletionSummary();
  });
}

// 気分選択
function setupMoodSelection() {
  const moodBtns = document.querySelectorAll('.mood-btn');
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.appState.selectedMood = btn.dataset.mood;
      checkAllSelected();
    });
  });
}

// 難易度選択
function setupLevelSelection() {
  const levelBtns = document.querySelectorAll('.level-btn');
  levelBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      levelBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.appState.selectedLevel = btn.dataset.level;
      checkAllSelected();
    });
  });
}

// 文数選択
function setupCountSelection() {
  const countBtns = document.querySelectorAll('.count-btn');
  countBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      countBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.appState.selectedCount = parseInt(btn.dataset.count);
      checkAllSelected();
    });
  });
}

// カード抽選（アニメーション演出付き）
async function handleDrawCards(e) {
  const button = e.target;
  const nameInput = document.getElementById('studentNameInput').value.trim();
  
  // バリデーション
  if (!nameInput) {
    alert('名前を入力してください');
    return;
  }
  if (!window.appState.selectedMood) {
    alert('気分を選択してください');
    return;
  }
  if (!window.appState.selectedLevel) {
    alert('難易度を選択してください');
    return;
  }
  if (!window.appState.selectedCount) {
    alert('1日の文数を選択してください');
    return;
  }
  
  // 名前を保存
  window.appState.studentName = nameInput;
  localStorage.setItem('studentName', nameInput);
  
  // ボタンの光りを止める
  button.classList.remove('ready');
  button.classList.add('drawing-cards');

  // 設定画面を非表示にしてからアニメーション開始
  document.getElementById('setupScreen').style.display = 'none';
  
  try {
    // アニメーション演出を表示
    await window.showCardDrawAnimation(async () => {
      // カードを抽選（既存の処理）
      await window.drawWeeklyCards({
        mood: window.appState.selectedMood,
        level: window.appState.selectedLevel,
        sentencesPerDay: window.appState.selectedCount
      });
    });
    
    // ボタンの光るエフェクトを解除
    button.classList.remove('drawing-cards');
    
    // カレンダー画面に遷移
    showCalendar();
    
  } catch (error) {
    console.error('カード抽選エラー:', error);
    button.classList.remove('drawing-cards');
    alert('カードの抽選に失敗しました。もう一度試してください。');
  }
}

// 設定リセット
async function handleResetSettings() {
  if (confirm('設定を変更すると、今週のカードがリセットされます。\n本当に変更しますか？')) {
    // Firestoreのユーザーデータを削除
    const user = window.getCurrentUser();
    if (user) {
      await window.saveUserData(user.uid, { weeklyData: null });
    }
    
    // LocalStorageとアプリステートをクリア
    localStorage.removeItem('weeklyData');
    window.appState.weeklyData = null;
    
    // 設定モーダルを閉じる
    document.getElementById('settingsModal').style.display = 'none';
    
    // セットアップ画面に遷移
    window.showSetupScreen();
  }
}

// レベルコンプリートモーダルを表示
function showLevelCompletionModal(level) {
  const levelNames = {
    easy: '初級',
    intermediate: '中級',
    advanced: '上級'
  };
  
  const levelIcons = {
    easy: '🌟',
    intermediate: '🚀',
    advanced: '💎'
  };
  
  const levelInfo = {
    easy: { name: '英検5級/4級', total: 365, desc: '基本文法マスター' },
    intermediate: { name: '英検3級', total: 360, desc: '複雑な文法マスター' },
    advanced: { name: '英検準2級/2級', total: 285, desc: '高度な表現マスター' }
  };
  
  const info = levelInfo[level];
  const completion = window.utils.checkAllLevelsCompletion();
  
  // 全レベルコンプリートチェック
  if (completion.allCompleted) {
    showAllLevelsCompletionModal();
    return;
  }
  
  // モーダルHTML
  const modalHTML = `
    <div class="completion-modal-overlay" id="completionModal">
      <div class="completion-modal">
        <div class="completion-icon">${levelIcons[level]}</div>
        <h2>${levelNames[level]}コンプリート！</h2>
        <p class="completion-subtitle">${info.total}文すべて完了しました</p>
        <div class="completion-info">
          <div class="completion-badge">
            <div class="badge-icon">🎓</div>
            <div class="badge-text">${info.name}レベル</div>
          </div>
          <div class="completion-badge">
            <div class="badge-icon">📚</div>
            <div class="badge-text">${info.desc}</div>
          </div>
        </div>
        <p class="completion-message">素晴らしい成果です！</p>
        <div class="completion-buttons">
          <button class="modal-btn secondary" onclick="window.continueCurrentLevel('${level}')">
            ${levelNames[level]}を続ける
          </button>
          <button class="modal-btn primary" onclick="window.changeLevel()">
            レベルを変更
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 全レベルコンプリートモーダル
function showAllLevelsCompletionModal() {
  const modalHTML = `
    <div class="completion-modal-overlay" id="completionModal">
      <div class="completion-modal all-complete">
        <div class="completion-icon">👑</div>
        <h2>全レベルコンプリート！</h2>
        <p class="completion-subtitle">1,095文すべて完了しました</p>
        <div class="completion-info">
          <div class="completion-badge">
            <div class="badge-icon">🌟</div>
            <div class="badge-text">初級: 365文</div>
          </div>
          <div class="completion-badge">
            <div class="badge-icon">🚀</div>
            <div class="badge-text">中級: 360文</div>
          </div>
          <div class="completion-badge">
            <div class="badge-icon">💎</div>
            <div class="badge-text">上級: 285文</div>
          </div>
        </div>
        <p class="completion-message">あなたは真のマスターです！</p>
        <div class="completion-buttons">
          <button class="modal-btn secondary" onclick="window.resetAllProgress()">
            最初からやり直す
          </button>
          <button class="modal-btn primary" onclick="window.closeCompletionModal()">
            好きなレベルを選ぶ
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 日本語表示切り替え
function toggleJapanese() {
  const japaneseEl = document.getElementById('affirmationJapanese');
  const btn = document.getElementById('toggleJapanese');
  
  if (japaneseEl.style.display === 'none') {
    japaneseEl.style.display = 'block';
    btn.textContent = '日本語を隠す';
  } else {
    japaneseEl.style.display = 'none';
    btn.textContent = '日本語を表示';
  }
}

// お手本音声再生
async function playModelAudio() {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  const affirmation = day.affirmations[window.appState.currentAffirmationIndex];
  
  const audioUrl = affirmation.modelAudioUrl || affirmation.audioUrl;
  
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      audio.play().catch(error => {
        console.error('❌ 音声再生エラー:', error);
        alert('音声の再生に失敗しました');
      });
    } catch (error) {
      console.error('❌ 音声オブジェクト作成エラー:', error);
    }
  } else {
    console.error('❌ 音声URLが見つかりません');
    alert('お手本音声が見つかりません');
  }
}

// 録音処理
async function handleRecord() {
  if (window.appState.isRecording) {
    stopRecording();
  } else {
    startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // iOS対応：サポートされているMIMEタイプを検出
    let mimeType = 'audio/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'audio/mp4'; // iOSで使用
    }
    
    window.appState.mediaRecorder = new MediaRecorder(stream, { mimeType });
    window.appState.audioChunks = [];
    window.appState.recordingMimeType = mimeType; // 保存しておく
    
    window.appState.mediaRecorder.ondataavailable = (e) => {
      window.appState.audioChunks.push(e.data);
    };
    
    window.appState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(window.appState.audioChunks, { 
        type: window.appState.recordingMimeType // 検出したタイプを使用
      });
      window.appState.recordings[window.appState.currentAffirmationIndex] = audioBlob;
      
      const audioUrl = URL.createObjectURL(audioBlob);
      document.getElementById('recordingAudio').src = audioUrl;
      document.getElementById('recordingPlayer').style.display = 'block';
      document.getElementById('completeBtn').style.display = 'block';

       // 🔧 追加: 完了ボタンを更新
      window.updateCompleteButton();
    };
    
    window.appState.mediaRecorder.start();
    window.appState.isRecording = true;
    
    const btn = document.getElementById('recordBtn');
    btn.innerHTML = '<span class="btn-icon">⏹️</span><span>停止</span>';
    btn.style.background = '#ef4444';
    
  } catch (error) {
    console.error('録音エラー:', error);
    alert('マイクへのアクセスが許可されていません');
  }
}

function stopRecording() {
  window.appState.mediaRecorder.stop();
  window.appState.mediaRecorder.stream.getTracks().forEach(track => track.stop());
  window.appState.isRecording = false;
  
  const btn = document.getElementById('recordBtn');
  btn.innerHTML = '<span class="btn-icon">🎤</span><span>録音する</span>';
  btn.removeAttribute('style');
}

// 完了処理
async function handleComplete() {
  const btn = document.getElementById('completeBtn');
  
  if (window.appState.recordings.length === 0) {
    alert('少なくとも1文は録音してください');
    return;
  }
  
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 送信中...';
  
  try {
    await window.uploadRecordingsToFirebase();
    window.showCompletionSummary();
  } catch (error) {
    console.error('送信エラー:', error);
    alert('送信に失敗しました');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ 完了して送信';
  }
}

// ==============================================
// 通知機能
// ==============================================

/**
 * 通知許可をリクエスト
 */
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('このブラウザは通知機能に対応していません');
    return false;
  }
  
  if (Notification.permission === 'granted') {
    console.log('✅ 通知許可済み');
    return true;
  }
  
  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('✅ 通知が許可されました');
      localStorage.setItem('notificationEnabled', 'true');
      
    // テスト通知を送信（Service Worker経由）
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const theme = window.getCurrentTheme();
        navigator.serviceWorker.controller.postMessage({
          type: 'SEND_TEST_NOTIFICATION',
          theme: theme
        });
      } else {
        // フォールバック
        new Notification('🔮 音読カレンダー', {
          body: '通知が有効になりました！毎日この時間にリマインドします'
        });
      }
      
      return true;
    } else {
      console.log('❌ 通知が拒否されました');
      document.getElementById('notificationToggle').checked = false;
      return false;
    }
  }
  
  alert('通知が拒否されています。ブラウザの設定から許可してください');
  document.getElementById('notificationToggle').checked = false;
  return false;
}

/**
 * 通知を無効化
 */
function disableNotifications() {
  localStorage.setItem('notificationEnabled', 'false');
  localStorage.removeItem('notificationTime');
  console.log('🔕 通知を無効化しました');
}

/**
 * 通知時刻を保存
 */
function saveNotificationTime(time) {
  localStorage.setItem('notificationTime', time);
  console.log(`⏰ 通知時刻を保存: ${time}`);
}

/**
 * 通知をスケジュール
 */
function scheduleNotification(time) {
  // Service Workerに通知スケジュールを依頼
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    const theme = window.getCurrentTheme();
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      time: time,
      theme: theme
    });
    console.log(`⏰ Service Workerに通知をスケジュール: ${time}`);
  } else {
    console.warn('⚠️ Service Workerが利用できません。通常の通知にフォールバック');
    scheduleNotificationFallback(time);
  }
}

/**
 * フォールバック：Service Worker未対応の場合
 */
function scheduleNotificationFallback(time) {
  const [hours, minutes] = time.split(':');
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }
  
  const delay = scheduledTime - now;
  
  setTimeout(() => {
    sendNotification();
    scheduleNotificationFallback(time);
  }, delay);
  
  console.log(`⏰ 次の通知（フォールバック）: ${scheduledTime.toLocaleString()}`);
}

/**
 * 通知を送信
 */
function sendNotification() {
  if (Notification.permission === 'granted') {
    const theme = window.getCurrentTheme();
    new Notification(`${theme.emoji} 今日の音読時間です！`, {
      body: '今日のアファメーションを音読しましょう 🎤',
      tag: 'daily-affirmation',
      requireInteraction: false
    });
  }
}

/**
 * 通知設定を読み込み
 */
function loadNotificationSettings() {
  const enabled = localStorage.getItem('notificationEnabled') === 'true';
  const time = localStorage.getItem('notificationTime') || '09:00';
  
  const toggle = document.getElementById('notificationToggle');
  const timeInput = document.getElementById('notificationTime');
  const timeSetting = document.getElementById('timeSetting');
  
  if (toggle && timeInput) {
    toggle.checked = enabled;
    timeInput.value = time;
    
    if (enabled) {
      timeSetting.style.display = 'flex';
      scheduleNotification(time);
    }
  }
}