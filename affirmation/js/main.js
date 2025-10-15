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
  
  // SNS選択ボタンにイベントリスナーを設定
  const shareButtons = document.querySelectorAll('.share-option-btn');
  shareButtons.forEach(btn => {
    btn.onclick = () => handleSharePlatform(btn.dataset.platform);
  });
}

// シェアモーダルを閉じる
function closeShareModal() {
  const modal = document.getElementById('shareModal');
  modal.style.display = 'none';
}

// 各プラットフォームへのシェア（修正版）
async function handleSharePlatform(platform) {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  
  // 今日の全アファメーションをテキストに
  const affirmationTexts = day.affirmations.map(aff => 
    `"${aff.text}"\n（${aff.japanese}）`
  ).join('\n\n');
  
  // シェアテキスト
  const shareText = `✨ 今日のアファメーション\n\n${affirmationTexts}\n\n#音読カレンダー #英語学習`;
  const shareUrl = window.location.href;
  
  switch (platform) {
    case 'twitter':
      shareToTwitter(shareText, shareUrl);
      break;
    case 'facebook':
      shareToFacebook(shareUrl, shareText);
      break;
    case 'download':
      await downloadAffirmationImage(day.affirmations);
      break;
    case 'copy':
      await copyToClipboard(shareText + '\n' + shareUrl);
      break;
  }
  
  closeShareModal();
}

// クリップボードにコピー
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    alert('📋 クリップボードにコピーしました！');
  } catch (error) {
    console.error('コピーエラー:', error);
    fallbackCopy(text);
  }
}

// フォールバック：コピー
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    alert('📋 クリップボードにコピーしました！');
  } catch (error) {
    alert('コピーに失敗しました');
  }
  
  document.body.removeChild(textarea);
}

// Twitterにシェア
function shareToTwitter(text, url) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// Facebookにシェア
function shareToFacebook(url, text) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
}

// レポート画像をダウンロード（NEW！）
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
// カード引く演出アニメーション
// ==============================================

/**
 * カード引く演出を表示（7秒版）
 * @param {Function} callback - アニメーション完了後に実行する関数
 */
async function showCardDrawAnimation(callback) {
  // ローディングオーバーレイを作成
  const overlay = createLoadingOverlay();
  document.body.appendChild(overlay);
  
  // 演出の流れ
  await sleep(400); // 0.4秒
  
  // ステップ1: カウントダウン（3, 2, 1）- 各0.8秒
  await showCountdown(overlay);
  
  // ステップ2: カードシャッフル演出 - 2.5秒
  await showCardShuffle(overlay);
  
  // ステップ3: キラキラエフェクト（20個）
  createSparkles(overlay, 20);
  
  // ステップ4: 実際のカード抽選処理
  if (callback) {
    await callback();
  }
  
  // ステップ5: 完了メッセージ - 1秒
  await showCompletionMessage(overlay);
  
  // ステップ6: フェードアウトしてオーバーレイを削除
  overlay.style.animation = 'fadeOut 0.5s ease';
  await sleep(500); // 0.5秒
  document.body.removeChild(overlay);
}

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
  `;
  return overlay;
}

/**
 * カウントダウン表示（3, 2, 1）- 各0.8秒
 */
async function showCountdown(overlay) {
  for (let i = 3; i > 0; i--) {
    const countdownNum = document.createElement('div');
    countdownNum.className = 'countdown-number';
    countdownNum.textContent = i;
    overlay.appendChild(countdownNum);
    
    await sleep(800); // 0.8秒
    overlay.removeChild(countdownNum);
  }
}

/**
 * カードシャッフル演出（改善版）
 */
async function showCardShuffle(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  loadingText.textContent = 'シャッフル中...';
  
  // カードを5枚表示（位置を動的に設定）
  const cards = [];
  const cardPositions = [20, 30, 40, 50, 60, 70, 80]; // 画面幅に対する%
  
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    card.className = 'card-shuffle';
    
    // JavaScriptで位置を設定
    card.style.left = `${cardPositions[i]}%`;
    card.style.animationDelay = `${i * 0.15}s`;
    
    overlay.appendChild(card);
    cards.push(card);
  }
  
  await sleep(2500); // 2.5秒間表示
  
  // カードを削除
  cards.forEach(card => overlay.removeChild(card));
}

/**
 * キラキラパーティクルを生成（増量版）
 */
function createSparkles(overlay, count = 30) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-particle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.animationDelay = `${Math.random() * 2}s`;
    sparkle.style.animationDuration = `${3 + Math.random() * 2}s`;
    overlay.appendChild(sparkle);
    
    // 6秒後に削除
    setTimeout(() => {
      if (overlay.contains(sparkle)) {
        overlay.removeChild(sparkle);
      }
    }, 6000);
  }
}

/**
 * 完了メッセージを表示（1秒表示）
 */
async function showCompletionMessage(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  loadingText.textContent = '';
  
  const message = document.createElement('div');
  message.className = 'completion-message';
  message.textContent = '✨ 今週のカードが決まりました！';
  overlay.appendChild(message);
  
  await sleep(1000); // 1秒
}

/**
 * 指定ミリ秒待つ
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}