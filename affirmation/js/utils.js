// ユーティリティ関数

// 日付フォーマット
function formatDate(date) {
  const d = new Date(date);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${month}/${day}`;
}

// 週の範囲を取得
function getWeekRange(startDate) {
  const start = new Date(startDate);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
    display: `${formatDate(start)} 〜 ${formatDate(end)}`
  };
}

// 曜日ラベル
function getDayLabel(date) {
  const days = ['月', '火', '水', '木', '金', '土', '日'];
  const d = new Date(date);
  return days[d.getDay() === 0 ? 6 : d.getDay() - 1]; // 月曜始まり
}

// 配列をシャッフル
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ランダムに要素を抽選（重複なし）
function pickRandomItems(array, count) {
  const shuffled = shuffleArray(array);
  return shuffled.slice(0, count);
}

// 時間をフォーマット（秒 → 分:秒）
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Base64にファイルを変換
function fileToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// ローディングスピナー
function showLoading(button, text = '送信中...') {
  button.disabled = true;
  button.dataset.originalText = button.innerHTML;
  button.innerHTML = `<span class="spinner"></span> ${text}`;
}

function hideLoading(button) {
  button.disabled = false;
  button.innerHTML = button.dataset.originalText || button.innerHTML;
}

// レベル別の使用済みID管理
function getUsedIdsByLevel(level) {
  const allUsed = JSON.parse(localStorage.getItem('usedAffirmationIds') || '{}');
  return allUsed[level] || [];
}

function markAsUsed(id, level) {
  const allUsed = JSON.parse(localStorage.getItem('usedAffirmationIds') || '{}');
  if (!allUsed[level]) allUsed[level] = [];
  if (!allUsed[level].includes(id)) {
    allUsed[level].push(id);
  }
  localStorage.setItem('usedAffirmationIds', JSON.stringify(allUsed));
}

function resetUsedIds(level = null) {
  if (level) {
    // 特定のレベルのみリセット
    const allUsed = JSON.parse(localStorage.getItem('usedAffirmationIds') || '{}');
    delete allUsed[level];
    localStorage.setItem('usedAffirmationIds', JSON.stringify(allUsed));
  } else {
    // 全レベルリセット
    localStorage.removeItem('usedAffirmationIds');
  }
}

// レベルコンプリート確認
function checkLevelCompletion(level) {
  const totalByLevel = { easy: 365, intermediate: 360, advanced: 285 };
  const usedIds = getUsedIdsByLevel(level);
  
  return {
    completed: usedIds.length >= totalByLevel[level],
    justCompleted: usedIds.length === totalByLevel[level],
    progress: usedIds.length,
    total: totalByLevel[level],
    percentage: Math.round((usedIds.length / totalByLevel[level]) * 100)
  };
}

// 全レベルコンプリート確認
function checkAllLevelsCompletion() {
  const easyComplete = checkLevelCompletion('easy');
  const intermediateComplete = checkLevelCompletion('intermediate');
  const advancedComplete = checkLevelCompletion('advanced');
  
  return {
    allCompleted: easyComplete.completed && intermediateComplete.completed && advancedComplete.completed,
    easy: easyComplete,
    intermediate: intermediateComplete,
    advanced: advancedComplete,
    totalProgress: easyComplete.progress + intermediateComplete.progress + advancedComplete.progress,
    totalAffirmations: 1095
  };
}

// グローバルに公開
// 連続記録日数を取得
function getCurrentStreak() {
  const weekData = JSON.parse(localStorage.getItem('weeklyData') || 'null');
  if (!weekData) return 0;
  
  let streak = 0;
  
  // 今週の完了日数をカウント
  for (let i = weekData.weeklyCards.length - 1; i >= 0; i--) {
    const day = weekData.weeklyCards[i];
    if (day.completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// レベル別進捗を取得
function getLevelProgress(level) {
  const usedIds = getUsedIdsByLevel(level);
  const totalByLevel = {
    easy: 365,
    intermediate: 360,
    advanced: 285
  };
  
  return {
    used: usedIds.length,
    total: totalByLevel[level],
    percentage: Math.round((usedIds.length / totalByLevel[level]) * 100)
  };
}

// ユーティリティ関数をエクスポート
window.utils = {
  formatDate,
  getWeekRange,
  getDayLabel,
  shuffleArray,
  pickRandomItems,
  formatDuration,
  fileToBase64,
  showLoading,
  hideLoading,
  markAsUsed,
  getUsedIdsByLevel,
  checkLevelCompletion,
  checkAllLevelsCompletion,
  resetUsedIds,
  getCurrentStreak,
  getLevelProgress
};

// ローカルタイムゾーンで YYYY-MM-DD 形式を取得
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// グローバルに公開
window.getLocalDateString = getLocalDateString;