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

// グローバルに公開（既存の行を探して、これに置き換え）
// 既存の行（そのまま）
window.continueCurrentLevel = continueCurrentLevel;
window.changeLevel = changeLevel;
window.resetAllProgress = resetAllProgress;
window.closeCompletionModal = closeCompletionModal;
window.showWeekSummary = showWeekSummary;
window.viewStatsFromSummary = viewStatsFromSummary;
window.startNewWeek = startNewWeek;

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

// 各プラットフォームへのシェア
async function handleSharePlatform(platform) {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  
  // 今日の全アファメーションをテキストに
  const affirmationTexts = day.affirmations.map(aff => 
    `"${aff.text}"\n（${aff.japanese}）`
  ).join('\n\n');
  
  // シェアテキスト
  const shareText = `今日のアファメーション 🌸\n\n${affirmationTexts}\n\n#音読カレンダー #英語学習`;
  const shareUrl = window.location.href;
  
  switch (platform) {
    case 'twitter':
      shareToTwitter(shareText, shareUrl);
      break;
    case 'facebook':
      shareToFacebook(shareUrl);
      break;
    case 'line':
      shareToLine(shareText, shareUrl);
      break;
    case 'instagram':
      await shareToInstagram(day.affirmations);
      break;
    case 'copy':
      await copyToClipboard(shareText + '\n' + shareUrl);
      break;
  }
  
  closeShareModal();
}

// Twitterにシェア
function shareToTwitter(text, url) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

// Facebookにシェア
function shareToFacebook(url) {
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
  window.open(facebookUrl, '_blank', 'width=600,height=400');
}

// LINEにシェア
function shareToLine(text, url) {
  const lineUrl = `https://line.me/R/msg/text/?${encodeURIComponent(text + '\n' + url)}`;
  window.open(lineUrl, '_blank');
}

// Instagramにシェア（画像生成）
async function shareToInstagram(affirmations) {
  try {
    // 画像を生成
    const imageBlob = await generateShareImage(affirmations);
    
    // Web Share API で画像を共有
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([imageBlob], 'affirmation.png', { type: 'image/png' })] })) {
      const file = new File([imageBlob], 'affirmation.png', { type: 'image/png' });
      await navigator.share({
        files: [file],
        title: '今日のアファメーション',
        text: '音読カレンダー'
      });
    } else {
      // フォールバック：画像をダウンロード
      const url = URL.createObjectURL(imageBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'affirmation.png';
      a.click();
      URL.revokeObjectURL(url);
      alert('📷 画像を保存しました！\nInstagramアプリから投稿してください。');
    }
  } catch (error) {
    console.error('Instagram シェアエラー:', error);
    alert('画像の生成に失敗しました');
  }
}

// シェア用画像を生成（複数のアファメーションに対応）
async function generateShareImage(affirmations) {
  const canvas = document.getElementById('shareCanvas');
  const ctx = canvas.getContext('2d');
  
  // Instagramストーリーサイズ（9:16）
  canvas.width = 1080;
  canvas.height = 1920;
  
  // グラデーション背景
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#8b5cf6');
  gradient.addColorStop(0.5, '#a78bfa');
  gradient.addColorStop(1, '#c4b5fd');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // アプリ名
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('音読カレンダー 📚', canvas.width / 2, 300);
  
  // 白い枠の高さを動的に調整
  const affCount = affirmations.length;
  const boxHeight = 200 + (affCount * 200);
  const boxY = (canvas.height - boxHeight) / 2;
  
  // 白い枠
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
  ctx.roundRect(80, boxY, canvas.width - 160, boxHeight, 40);
  ctx.fill();
  
  // 各アファメーションを描画
  let currentY = boxY + 100;
  affirmations.forEach((aff, index) => {
    // 英文
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    
    const text = affirmations.length > 1 ? `${index + 1}. ${aff.text}` : aff.text;
    ctx.fillText(text, canvas.width / 2, currentY);
    
    // 日本語訳
    ctx.fillStyle = '#6b7280';
    ctx.font = '36px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillText(`（${aff.japanese}）`, canvas.width / 2, currentY + 60);
    
    currentY += 200;
  });
  
  // ハッシュタグ
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.font = '40px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  ctx.fillText('#音読カレンダー #英語学習', canvas.width / 2, canvas.height - 200);
  
  // Canvasを画像に変換
  return new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/png');
  });
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

// グローバルに公開
window.showCompletionSummary = showCompletionSummary;
window.closeCompletionSummary = closeCompletionSummary;
window.openShareModalFromCompletion = openShareModalFromCompletion;
window.closeShareModal = closeShareModal;