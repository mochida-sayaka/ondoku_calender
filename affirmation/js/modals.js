// ==============================================
// モーダル表示機能
// ==============================================

/**
 * レベルコンプリートモーダルを表示
 */
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

/**
 * 全レベルコンプリートモーダル
 */
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

/**
 * モーダルを閉じる
 */
function closeCompletionModal() {
  const modal = document.getElementById('completionModal');
  if (modal) modal.remove();
}

/**
 * 現在のレベルを続ける
 */
function continueCurrentLevel(level) {
  closeCompletionModal();
  // そのまま続行
}

/**
 * レベルを変更
 */
function changeLevel() {
  closeCompletionModal();
  showSetupScreen();
}

/**
 * 全進捗をリセット
 */
function resetAllProgress() {
  if (confirm('本当に全ての進捗をリセットしますか？\nこの操作は取り消せません。')) {
    window.utils.resetUsedIds();
    closeCompletionModal();
    showSetupScreen();
    alert('✨ 進捗をリセットしました！新しい旅の始まりです。');
  }
}

/**
 * 完了サマリーを表示
 */
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
    window.triggerConfetti({
      count: 100,
      colors: ['#9c27b0', '#e91e63', '#ffd700', '#2196f3', '#ffffff'],
      duration: 4000,
      size: { min: 8, max: 15 },
      message: '🎉 今週コンプリート！'
    });
  } else {
    // 毎日の完了：控えめバージョン
    window.triggerConfetti({
      count: 30,
      colors: ['#9c27b0', '#e91e63'],
      duration: 2000,
      size: { min: 6, max: 10 }
    });
  }
}

/**
 * 完了サマリーを閉じる
 */
function closeCompletionSummary() {
  document.getElementById('completionSummaryModal').style.display = 'none';
  showCalendar();
}

/**
 * 週終了サマリーを表示
 */
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

/**
 * 週の統計を計算
 */
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

/**
 * 統計画面へ移動
 */
function viewStatsFromSummary() {
  const modal = document.getElementById('weekSummaryModal');
  if (modal) modal.remove();
  showStatsScreen();
}

/**
 * 新しい週を開始
 */
function startNewWeek() {
  const modal = document.getElementById('weekSummaryModal');
  if (modal) modal.remove();
  
  // 週データをクリア
  localStorage.removeItem('weeklyData');
  window.appState.weeklyData = null;
  
  // 設定画面へ
  showSetupScreen();
}

/**
 * 日付をフォーマット
 */
function formatDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${month}/${day}`;
}

/**
 * レベルアイコンを取得
 */
function getLevelIcon(level) {
  const icons = {
    easy: '🌟',
    intermediate: '🚀',
    advanced: '💎'
  };
  return icons[level] || '📚';
}

/**
 * レベル名を取得
 */
function getLevelName(level) {
  const names = {
    easy: '初級',
    intermediate: '中級',
    advanced: '上級'
  };
  return names[level] || '';
}

// グローバルに公開
window.showCompletionSummary = showCompletionSummary;
window.closeCompletionSummary = closeCompletionSummary;
window.showWeekSummary = showWeekSummary;
window.viewStatsFromSummary = viewStatsFromSummary;
window.startNewWeek = startNewWeek;
window.continueCurrentLevel = continueCurrentLevel;
window.changeLevel = changeLevel;
window.resetAllProgress = resetAllProgress;
window.closeCompletionModal = closeCompletionModal;