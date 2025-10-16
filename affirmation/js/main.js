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
  const { db: database, storage: storageInstance } = window.initFirebase();
  window.db = database;
  window.storage = storageInstance;
  
  // LocalStorageから名前を読み込み
  const savedName = localStorage.getItem('studentName');
  if (savedName) {
    window.appState.studentName = savedName;
    document.getElementById('studentNameInput').value = savedName;
  }
  
  // LocalStorageから週データを読み込み
  const savedWeekData = localStorage.getItem('weeklyData');
  if (savedWeekData) {
    window.appState.weeklyData = JSON.parse(savedWeekData);
    
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

// イベントリスナー設定
function setupEventListeners() {
  // 設定画面
  setupMoodSelection();
  setupLevelSelection();
  setupCountSelection();
  document.getElementById('drawCardsBtn').addEventListener('click', handleDrawCards);
  
  // カレンダー画面
  document.getElementById('statsBtn').addEventListener('click', showStatsScreen);
  document.getElementById('settingsBtn').addEventListener('click', handleResetSettings);
  
  // アファメーション画面
  document.getElementById('backBtn').addEventListener('click', showCalendar);
  document.getElementById('toggleJapanese').addEventListener('click', toggleJapanese);
  document.getElementById('playModelBtn').addEventListener('click', playModelAudio);
  document.getElementById('recordBtn').addEventListener('click', handleRecord);
  document.getElementById('completeBtn').addEventListener('click', handleComplete);
  
// テーマボタン
  document.getElementById('themeBtn').addEventListener('click', () => {
    document.getElementById('themeModal').style.display = 'flex';
  });
  
  // テーマモーダルを閉じる
  document.getElementById('closeThemeModalBtn').addEventListener('click', () => {
    document.getElementById('themeModal').style.display = 'none';
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
      // モーダルは閉じない（着せ替えのように試せる）
    });
  });

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
function handleResetSettings() {
  if (confirm('設定を変更すると、今週のカードがリセットされます。\n本当に変更しますか？')) {
    localStorage.removeItem('weeklyData');
    window.appState.weeklyData = null;
    location.reload();
  }
}

// 画面表示制御
function showSetupScreen() {
  document.getElementById('setupScreen').style.display = 'block';
  document.getElementById('calendarScreen').style.display = 'none';
  document.getElementById('affirmationScreen').style.display = 'none';
  document.getElementById('statsScreen').style.display = 'none';
}

function showCalendar() {
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('calendarScreen').style.display = 'block';
  document.getElementById('affirmationScreen').style.display = 'none';
  document.getElementById('statsScreen').style.display = 'none';
  
  // レベルコンプリート確認
  const justCompletedLevel = localStorage.getItem('justCompletedLevel');
  if (justCompletedLevel) {
    localStorage.removeItem('justCompletedLevel');
    setTimeout(() => showLevelCompletionModal(justCompletedLevel), 500);
  }
  
  window.renderCalendar();
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

function showStatsScreen() {
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('calendarScreen').style.display = 'none';
  document.getElementById('affirmationScreen').style.display = 'none';
  document.getElementById('statsScreen').style.display = 'block';
  
  window.loadAndDisplayStats();
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