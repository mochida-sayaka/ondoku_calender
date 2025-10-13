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

// グローバルに公開
window.utils = {
  formatDate,
  getWeekRange,
  getDayLabel,
  shuffleArray,
  pickRandomItems,
  formatDuration,
  fileToBase64,
  showLoading,
  hideLoading
};