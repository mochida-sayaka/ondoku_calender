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
  audioChunks: []
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
      // 週が終了したので設定画面に戻る
      showSetupScreen();
    }
  } else {
    // 初回起動
    showSetupScreen();
  }
  
  // イベントリスナーを設定
  setupEventListeners();
  
  console.log('✅ 初期化完了');
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
  
  // 統計画面
  document.getElementById('backToCalendarBtn').addEventListener('click', showCalendar);
}

// 気分選択
function setupMoodSelection() {
  const moodBtns = document.querySelectorAll('.mood-btn');
  moodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      moodBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      window.appState.selectedMood = btn.dataset.mood;
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
    });
  });
}

// カード抽選
async function handleDrawCards() {
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
  
  // カードを抽選
  try {
    await window.drawWeeklyCards({
      mood: window.appState.selectedMood,
      level: window.appState.selectedLevel,
      sentencesPerDay: window.appState.selectedCount
    });
    
    showCalendar();
  } catch (error) {
    console.error('カード抽選エラー:', error);
    alert('カードの抽選に失敗しました。もう一度試してください。');
  }
}

// 設定リセット
function handleResetSettings() {
  if (confirm('設定を変更すると、今週のカードがリセットされます。\n本当に変更しますか？')) {
    localStorage.removeItem('weeklyData');
    window.appState.weeklyData = null;
    showSetupScreen();
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
  
  window.renderCalendar();
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
  
  if (affirmation.audioUrl) {
    const audio = new Audio(affirmation.audioUrl);
    audio.play();
  }
}

// 録音処理
async function handleRecord() {
  if (window.appState.isRecording) {
    // 録音停止
    stopRecording();
  } else {
    // 録音開始
    startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    window.appState.mediaRecorder = new MediaRecorder(stream);
    window.appState.audioChunks = [];
    
    window.appState.mediaRecorder.ondataavailable = (e) => {
      window.appState.audioChunks.push(e.data);
    };
    
    window.appState.mediaRecorder.onstop = () => {
      const audioBlob = new Blob(window.appState.audioChunks, { type: 'audio/webm' });
      window.appState.recordings[window.appState.currentAffirmationIndex] = audioBlob;
      
      // 録音を再生できるようにする
      const audioUrl = URL.createObjectURL(audioBlob);
      document.getElementById('recordingAudio').src = audioUrl;
      document.getElementById('recordingPlayer').style.display = 'block';
      
      // 完了ボタンを表示
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
  
  // バリデーション
  if (window.appState.recordings.length === 0) {
    alert('少なくとも1文は録音してください');
    return;
  }
  
  // ローディング表示
  btn.disabled = true;
  btn.innerHTML = '<span class="spinner"></span> 送信中...';
  
  try {
    await window.uploadRecordingsToFirebase();
    alert('✨ 送信しました！');
    showCalendar();
  } catch (error) {
    console.error('送信エラー:', error);
    alert('送信に失敗しました');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ 完了して送信';
  }
}