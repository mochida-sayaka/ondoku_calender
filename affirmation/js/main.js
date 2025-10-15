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
      // 週が終了した！サマリーを表示
      showWeekSummary();
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
  
  // 完了サマリーモーダル
  document.getElementById('closeCompletionSummaryBtn')?.addEventListener('click', closeCompletionSummary);
  document.getElementById('shareBtn')?.addEventListener('click', openShareModalFromCompletion);
  
  // シェアモーダル
  document.getElementById('closeShareModalBtn')?.addEventListener('click', closeShareModal);
  document.getElementById('downloadImageBtn')?.addEventListener('click', async () => {
    const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
    await downloadAffirmationImage(day.affirmations);
  });
  document.getElementById('closeShareAndReturnBtn')?.addEventListener('click', () => {
    closeShareModal();
    closeCompletionSummary();
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

// ==============================================
// カード抽選（アニメーション演出付き）
// ==============================================
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
  
  // ボタンを光らせる
  button.classList.add('drawing-cards');
  
  try {
    // アニメーション演出を表示
    await showCardDrawAnimation(async () => {
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
          <button class="modal-btn secondary" onclick="continueCurrentLevel('${level}')">
            ${levelNames[level]}を続ける
          </button>
          <button class="modal-btn primary" onclick="changeLevel()">
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
          <button class="modal-btn secondary" onclick="resetAllProgress()">
            最初からやり直す
          </button>
          <button class="modal-btn primary" onclick="closeCompletionModal()">
            好きなレベルを選ぶ
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// モーダルを閉じる
function closeCompletionModal() {
  const modal = document.getElementById('completionModal');
  if (modal) modal.remove();
}

// 現在のレベルを続ける
function continueCurrentLevel(level) {
  closeCompletionModal();
  // そのまま続行
}

// レベルを変更
function changeLevel() {
  closeCompletionModal();
  showSetupScreen();
}

// 全進捗をリセット
function resetAllProgress() {
  if (confirm('本当に全ての進捗をリセットしますか？\nこの操作は取り消せません。')) {
    window.utils.resetUsedIds();
    closeCompletionModal();
    showSetupScreen();
    alert('✨ 進捗をリセットしました！新しい旅の始まりです。');
  }
}

// グローバルに公開
window.continueCurrentLevel = continueCurrentLevel;
window.changeLevel = changeLevel;
window.resetAllProgress = resetAllProgress;
window.closeCompletionModal = closeCompletionModal;

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
  
  // modelAudioUrl を使用（Firestoreのフィールド名に合わせる）
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
    
    // 成功したら完了サマリーを表示
    showCompletionSummary();
    
  } catch (error) {
    console.error('送信エラー:', error);
    alert('送信に失敗しました');
  } finally {
    btn.disabled = false;
    btn.innerHTML = '✨ 完了して送信';
  }
}

// 週終了サマリーを表示
async function showWeekSummary() {
  console.log('📊 週終了サマリーを表示');
  
  const weekData = window.appState.weeklyData;
  if (!weekData) {
    showSetupScreen();
    return;
  }
  
  // 今週の統計を計算
  const stats = await calculateWeekStats(weekData);
  
  // モーダルHTML
  const modalHTML = `
    <div class="completion-modal-overlay" id="weekSummaryModal">
      <div class="completion-modal week-summary">
        <div class="completion-icon">🎊</div>
        <h2>今週お疲れ様でした！</h2>
        <p class="completion-subtitle">${stats.weekPeriod}</p>
        
        <div class="week-stats">
          <div class="week-stat">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-label">完了日数</div>
              <div class="stat-value">${stats.completedDays}/7日</div>
            </div>
          </div>
          
          <div class="week-stat">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-label">完了文数</div>
              <div class="stat-value">${stats.totalAffirmations}文</div>
            </div>
          </div>
          
          <div class="week-stat">
            <div class="stat-icon">⏱️</div>
            <div class="stat-info">
              <div class="stat-label">録音時間</div>
              <div class="stat-value">約${stats.estimatedTime}分</div>
            </div>
          </div>
          
          <div class="week-stat">
            <div class="stat-icon">🔥</div>
            <div class="stat-info">
              <div class="stat-label">連続記録</div>
              <div class="stat-value">${stats.currentStreak}日継続中</div>
            </div>
          </div>
        </div>
        
        ${stats.achievements.length > 0 ? `
          <div class="week-achievements">
            <h3>📈 今週の成長</h3>
            <ul>
              ${stats.achievements.map(a => `<li>${a}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        <p class="completion-message">素晴らしい1週間でした！</p>
        
        <div class="completion-buttons">
          <button class="modal-btn secondary" onclick="viewStatsFromSummary()">
            📊 統計を見る
          </button>
          <button class="modal-btn primary" onclick="startNewWeek()">
            ✨ 次の週へ
          </button>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 週の統計を計算
async function calculateWeekStats(weekData) {
  const { weekStartDate, weekEndDate, weeklyCards, settings } = weekData;
  
  // 完了日数を計算
  let completedDays = 0;
  weeklyCards.forEach(day => {
    if (day.completed) completedDays++;
  });
  
  // 完了文数を計算
  const totalAffirmations = completedDays * settings.sentencesPerDay;
  
  // 録音時間を推定（1文あたり30秒と仮定）
  const estimatedTime = Math.round(totalAffirmations * 0.5);
  
  // 連続記録を取得
  const currentStreak = await window.utils.getCurrentStreak();
  
  // 今週の成長（達成項目）
  const achievements = [];
  
  if (completedDays === 7) {
    achievements.push('🎯 全日完了達成！');
  }
  
  if (currentStreak >= 7) {
    achievements.push(`🔥 ${currentStreak}日連続達成！`);
  }
  
  // レベル別進捗
  const levelProgress = window.utils.getLevelProgress(settings.level);
  if (levelProgress) {
    achievements.push(`${getLevelIcon(settings.level)} ${getLevelName(settings.level)}: +${totalAffirmations}文`);
  }
  
  // 期間をフォーマット
  const startDate = new Date(weekStartDate);
  const endDate = new Date(weekEndDate);
  const weekPeriod = `${formatDate(startDate)} 〜 ${formatDate(endDate)}`;
  
  return {
    weekPeriod,
    completedDays,
    totalAffirmations,
    estimatedTime,
    currentStreak,
    achievements
  };
}

// 統計画面へ移動
function viewStatsFromSummary() {
  const modal = document.getElementById('weekSummaryModal');
  if (modal) modal.remove();
  showStatsScreen();
}

// 新しい週を開始
function startNewWeek() {
  const modal = document.getElementById('weekSummaryModal');
  if (modal) modal.remove();
  
  // 週データをクリア
  localStorage.removeItem('weeklyData');
  window.appState.weeklyData = null;
  
  // 設定画面へ
  showSetupScreen();
}

// ヘルパー関数
function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

function getLevelIcon(level) {
  const icons = {
    easy: '🌟',
    intermediate: '🚀',
    advanced: '💎'
  };
  return icons[level] || '📚';
}

function getLevelName(level) {
  const names = {
    easy: '初級',
    intermediate: '中級',
    advanced: '上級'
  };
  return names[level] || '';
}

// 完了サマリーを表示
function showCompletionSummary() {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  
  // 今日のアファメーションリストを生成
  const listHTML = day.affirmations.map(aff => `
    <div class="completed-aff-item">
      <div class="aff-bullet">✓</div>
      <div class="aff-content">
        <div class="aff-text">${aff.text}</div>
        <div class="aff-japanese">${aff.japanese}</div>
      </div>
    </div>
  `).join('');
  
  document.getElementById('completedAffirmationsList').innerHTML = listHTML;
  document.getElementById('completionSummaryModal').style.display = 'flex';
  
  // 週の完了状況をチェック
  const completedDays = window.appState.weeklyData.weeklyCards.filter(d => d.completed).length;
  const isWeekComplete = completedDays === 7;
  
  // 紙吹雪を発動！
  if (isWeekComplete) {
    // 1週間完了：超派手バージョン
    triggerConfetti({
      count: 100,
      colors: ['#9c27b0', '#e91e63', '#ffd700', '#2196f3', '#ffffff'],
      duration: 4000,
      size: { min: 8, max: 15 },
      message: '🎉 今週コンプリート！'
    });
  } else {
    // 毎日の完了：控えめバージョン
    triggerConfetti({
      count: 30,
      colors: ['#9c27b0', '#e91e63'],
      duration: 2000,
      size: { min: 6, max: 10 }
    });
  }
}

// 完了サマリーを閉じる
function closeCompletionSummary() {
  document.getElementById('completionSummaryModal').style.display = 'none';
  showCalendar();
}

// ==============================================
// シェア機能（修正版 - LINE/Instagram削除、画像DL追加）
// ==============================================

// 完了サマリーからシェアモーダルを開く
function openShareModalFromCompletion() {
  const modal = document.getElementById('shareModal');
  modal.style.display = 'flex';
}

// シェアモーダルを閉じる
function closeShareModal() {
  const modal = document.getElementById('shareModal');
  modal.style.display = 'none';
}

// レポート画像をダウンロード
async function downloadAffirmationImage(affirmations) {
  try {
    // 統計データを取得
    const stats = await getStatsForImage();
    
    // Canvas作成
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');

    // 背景（グラデーション）
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // 白い半透明のカード
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, 60, 60, 960, 960, 30);
    ctx.fill();

    // タイトル
    ctx.fillStyle = '#4a148c';
    ctx.font = 'bold 50px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨ Today\'s Affirmation', 540, 150);

    // 日付
    ctx.fillStyle = '#7b1fa2';
    ctx.font = '30px "Arial", sans-serif';
    const date = new Date();
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
    ctx.fillText(dateStr, 540, 200);

    // 区切り線
    ctx.strokeStyle = '#e1bee7';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 230);
    ctx.lineTo(930, 230);
    ctx.stroke();

    // アファメーション（英語 + 日本語）
    let yPos = 280;
    affirmations.forEach((aff, index) => {
      // 英語
      ctx.fillStyle = '#4a148c';
      ctx.font = 'bold 38px "Arial", sans-serif';
      ctx.textAlign = 'center';
      
      const prefix = affirmations.length > 1 ? `${index + 1}. ` : '';
      const engLines = wrapText(ctx, prefix + aff.text, 850);
      engLines.forEach(line => {
        ctx.fillText(line, 540, yPos);
        yPos += 50;
      });

      // 日本語
      ctx.fillStyle = '#7b1fa2';
      ctx.font = '28px "Arial", sans-serif';
      const jpLines = wrapText(ctx, aff.japanese, 850);
      jpLines.forEach(line => {
        ctx.fillText(line, 540, yPos);
        yPos += 40;
      });
      
      yPos += 20; // 次の文との間隔
    });

    // 統計情報セクション（背景）
    const statsY = Math.min(yPos + 20, 650);
    const statsHeight = 250;
    ctx.fillStyle = '#f3e5f5';
    roundRect(ctx, 150, statsY, 780, statsHeight, 20);
    ctx.fill();

    // 統計タイトル
    ctx.fillStyle = '#4a148c';
    ctx.font = 'bold 35px "Arial", sans-serif';
    ctx.fillText('📊 My Progress', 540, statsY + 60);

    // 統計データ
    ctx.font = '28px "Arial", sans-serif';
    ctx.fillStyle = '#6a1b9a';
    ctx.textAlign = 'left';

    const statsList = [
      `🔥 連続記録：${stats.currentStreak}日`,
      `✅ 今週の完了率：${stats.weekCompletion}%`,
      `📅 累計日数：${stats.totalDays}日`
    ];

    let statY = statsY + 110;
    statsList.forEach(stat => {
      ctx.fillText(stat, 200, statY);
      statY += 50;
    });

    // ロゴ・URL
    ctx.fillStyle = '#9c27b0';
    ctx.font = '24px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🔮 Affirmation Calendar', 540, 1020);

    // ダウンロード
    canvas.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `affirmation-${new Date().toISOString().split('T')[0]}.png`;
      a.click();
      URL.revokeObjectURL(url);
      
      alert('📸 画像をダウンロードしました！');
    });
  } catch (error) {
    console.error('画像生成エラー:', error);
    alert('画像の生成に失敗しました');
  }
}

// 画像用の統計データを取得
async function getStatsForImage() {
  try {
    // stats.js の関数を使用
    if (window.calculateStats) {
      return await window.calculateStats();
    }
    
    // フォールバック
    return {
      currentStreak: 1,
      weekCompletion: 0,
      totalDays: 1
    };
  } catch (error) {
    console.error('統計取得エラー:', error);
    return {
      currentStreak: 0,
      weekCompletion: 0,
      totalDays: 0
    };
  }
}

// テキストを折り返す関数
function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

// roundRect のポリフィル（Canvas API）
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  return ctx;
}

// グローバルに公開
window.showWeekSummary = showWeekSummary;
window.viewStatsFromSummary = viewStatsFromSummary;
window.startNewWeek = startNewWeek;
window.showCompletionSummary = showCompletionSummary;
window.closeCompletionSummary = closeCompletionSummary;
window.openShareModalFromCompletion = openShareModalFromCompletion;
window.closeShareModal = closeShareModal;

// ==============================================
// カード引く演出アニメーション（GSAP版）
// ==============================================

/**
 * ローディングオーバーレイを作成
 */
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="magic-circle">
      <div class="magic-icon">🔮</div>
    </div>
    <div class="loading-text">カードを引いています...</div>
    <button class="skip-animation-btn">スキップ ⏭️</button>
  `;
  return overlay;
}

/**
 * 指定ミリ秒待つ
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * カード引く演出を表示（GSAP版・修正）
 * @param {Function} callback - アニメーション完了後に実行する関数
 */
async function showCardDrawAnimation(callback) {
  // GSAPが読み込まれているか確認
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAPが読み込まれていません');
    alert('アニメーションの準備中です。もう一度試してください。');
    if (callback) await callback();
    return;
  }
  // ローディングオーバーレイを作成
  const overlay = createLoadingOverlay();
  document.body.appendChild(overlay);
  
// スキップボタンのイベントリスナー
  let isSkipped = false;
  const skipBtn = overlay.querySelector('.skip-animation-btn');
  skipBtn.addEventListener('click', () => {
    isSkipped = true;
    gsap.killTweensOf("*"); // すべてのアニメーションを停止
    overlay.remove();
    if (callback) callback();
    showCalendar();
  });

  // GSAPでオーバーレイをフェードイン
  gsap.from(overlay, {
    duration: 0.4,
    opacity: 0,
    ease: "power2.out"
  });
  
  await sleep(400);
  
  // ステップ1: 魔法陣をアニメーション
  animateMagicCircle(overlay);
  
  // ステップ2: カウントダウン（3, 2, 1）
  await showCountdownGSAP(overlay);
  
  // ステップ3: カードシャッフル演出
  await showCardShuffleGSAP(overlay);
  
  // ステップ4: キラキラエフェクト
  createSparklesGSAP(overlay, 30);
  
  // ステップ5: 完了メッセージ
  await showCompletionMessageGSAP(overlay);
  
  // ステップ6: 実際のカード抽選処理（アニメーション後に実行）
  if (callback) {
    await callback();
  }
  
  // ステップ7: フェードアウトしてオーバーレイを削除
  await gsap.to(overlay, {
    duration: 0.6,
    opacity: 0,
    ease: "power2.in"
  });
  
  document.body.removeChild(overlay);
}

/**
 * 魔法陣をアニメーション
 */
function animateMagicCircle(overlay) {
  const magicCircle = overlay.querySelector('.magic-circle');
  const magicIcon = overlay.querySelector('.magic-icon');
  
  // 魔法陣を回転
  gsap.to(magicCircle, {
    duration: 2,
    rotation: 360,
    repeat: -1,
    ease: "none"
  });
  
  // アイコンをパルス
  gsap.to(magicIcon, {
    duration: 1,
    scale: 1.2,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });
  
  // 魔法陣を輝かせる
  gsap.to(magicCircle, {
    duration: 1.5,
    boxShadow: "0 0 100px rgba(255, 255, 255, 0.8), 0 0 150px rgba(255, 215, 0, 0.6)",
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });
}

/**
 * カウントダウン表示（GSAP版）
 */
async function showCountdownGSAP(overlay) {
  for (let i = 3; i > 0; i--) {
    const countdownNum = document.createElement('div');
    countdownNum.className = 'countdown-number';
    countdownNum.textContent = i;
    countdownNum.style.opacity = '0';
    countdownNum.style.transform = 'scale(0)';
    overlay.appendChild(countdownNum);
    
    // GSAPで登場アニメーション
    await gsap.to(countdownNum, {
      duration: 0.6,
      opacity: 1,
      scale: 1.3,
      ease: "back.out(3)"
    });
    
    await sleep(600);
    
    await gsap.to(countdownNum, {
      duration: 0.4,
      opacity: 0,
      scale: 0.5,
      ease: "power2.in"
    });
    
    overlay.removeChild(countdownNum);
  }
}

/**
 * カードシャッフル演出（GSAP版）
 */
async function showCardShuffleGSAP(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  
  // テキストをアニメーション
  gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0,
    onComplete: () => {
      loadingText.textContent = 'シャッフル中...';
      gsap.to(loadingText, {
        duration: 0.3,
        opacity: 1
      });
    }
  });
  
  await sleep(500);
  
  // カードを5枚生成
  const cards = [];
  const cardPositions = [15, 30, 45, 60, 75];
  
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    card.className = 'card-shuffle';
    card.style.left = `${cardPositions[i]}%`;
    card.style.top = '50%';
    card.style.opacity = '0';
    overlay.appendChild(card);
    cards.push(card);
  }
  
  // GSAPで順番に登場
gsap.from(cards, {
    duration: 0.8,
    y: 200,
    opacity: 0,
    rotation: -30,
    scale: 0.5,
    stagger: 0.15,
    ease: "back.out(2)"
  });
  
  await sleep(1200);
  
  gsap.to(cards, {
    duration: 2,
    y: -30,
    rotation: 360,
    scale: 1.15,
    stagger: 0.12,
    ease: "elastic.out(1, 0.4)",
    repeat: 1,
    yoyo: true
  });
  
  await sleep(3500);
  
  // カードを消す
await gsap.to(cards, {
    duration: 0.5,
    y: -100,
    opacity: 0,
    rotation: 720,
    stagger: 0.08,
    ease: "power2.in"
  });
  
  cards.forEach(card => overlay.removeChild(card));
}

/**
 * キラキラパーティクルを生成（GSAP版）
 */
function createSparklesGSAP(overlay, count = 20) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-particle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.opacity = '0';
    overlay.appendChild(sparkle);
    
    // 中心からの距離を計算（放射状に広がる）
    const centerX = 50;
    const centerY = 50;
    const x = parseFloat(sparkle.style.left);
    const y = parseFloat(sparkle.style.top);
    const angle = Math.atan2(y - centerY, x - centerX);
    const distance = 100;
    
    // GSAPでアニメーション
    gsap.to(sparkle, {
      duration: 2 + Math.random(),
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 1,
      scale: 1.5,
      rotation: Math.random() * 360,
      ease: "power1.out",
      delay: Math.random() * 0.5,
      onComplete: () => {
        gsap.to(sparkle, {
          duration: 0.5,
          opacity: 0,
          onComplete: () => {
            if (overlay.contains(sparkle)) {
              overlay.removeChild(sparkle);
            }
          }
        });
      }
    });
  }
}

/**
 * 完了メッセージを表示（GSAP版）
 */
async function showCompletionMessageGSAP(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  
  // テキストを「抽選中...」に変更
await gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0,
    scale: 0.8,
    onComplete: () => {
      loadingText.textContent = '抽選中...';
    }
  });
  
  await gsap.to(loadingText, {
    duration: 0.4,
    opacity: 1,
    scale: 1
  });
  
  await sleep(1000);
  
  // 完了メッセージに変更
  await gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0
  });
  
  loadingText.textContent = '';
  
  const message = document.createElement('div');
  message.className = 'completion-message';
  message.textContent = '✨ 今週のカードが決まりました！';
  message.style.opacity = '0';
  message.style.transform = 'scale(0)';
  overlay.appendChild(message);
  
  await gsap.to(message, {
    duration: 0.8,
    opacity: 1,
    scale: 1,
    ease: "back.out(2)"
  });
  
  await sleep(1200);
}

// ==============================================
// 紙吹雪アニメーション（GSAP版）
// ==============================================

/**
 * 紙吹雪を発動
 * @param {Object} options - 紙吹雪のオプション
 */
function triggerConfetti(options = {}) {
  const {
    count = 30,
    colors = ['#9c27b0', '#e91e63'],
    duration = 2000,
    size = { min: 6, max: 10 },
    message = null
  } = options;
  
  // 特別メッセージがあれば表示
  if (message) {
    showSpecialMessage(message);
  }
  
  // 紙吹雪を生成
  for (let i = 0; i < count; i++) {
    createConfettiPiece(colors, duration, size);
  }
}

/**
 * 特別メッセージを表示
 */
function showSpecialMessage(message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'confetti-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 48px;
    font-weight: bold;
    color: #9c27b0;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    z-index: 100000;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(messageEl);
  
  // GSAPでアニメーション
  gsap.to(messageEl, {
    duration: 0.8,
    opacity: 1,
    scale: 1,
    ease: "back.out(2)",
    onComplete: () => {
      gsap.to(messageEl, {
        duration: 0.5,
        opacity: 0,
        delay: 2,
        onComplete: () => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }
      });
    }
  });
}

/**
 * 紙吹雪の1ピースを生成
 */
function createConfettiPiece(colors, duration, size) {
  const confetti = document.createElement('div');
  
  // ランダムな色を選択
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // ランダムなサイズ
  const pieceSize = size.min + Math.random() * (size.max - size.min);
  
  // ランダムな形（丸 or 四角）
  const isCircle = Math.random() > 0.5;
  
  // ランダムな開始位置
  const startLeft = Math.random() * 100;
  
  confetti.style.cssText = `
    position: fixed;
    width: ${pieceSize}px;
    height: ${pieceSize}px;
    background-color: ${color};
    border-radius: ${isCircle ? '50%' : '0'};
    top: -20px;
    left: ${startLeft}%;
    z-index: 99999;
    pointer-events: none;
  `;
  
  document.body.appendChild(confetti);
  
  // ランダムな動き
  const randomX = (Math.random() - 0.5) * 300;
  const randomRotation = Math.random() * 720 - 360;
  const fallDuration = duration / 1000;
  
  // GSAPでアニメーション（1つのアニメーションに統合）
  gsap.to(confetti, {
    duration: fallDuration,
    y: window.innerHeight + 50,
    x: randomX,
    rotation: randomRotation,
    opacity: 0,
    ease: "power1.in",
    onComplete: () => {
      if (document.body.contains(confetti)) {
        document.body.removeChild(confetti);
      }
    }
  });
}