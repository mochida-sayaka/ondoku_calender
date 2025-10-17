// ==============================================
// 画面遷移管理（統一システム）
// ==============================================

const SCREENS = {
  LOGIN: 'loginScreen',
  SETUP: 'setupScreen',
  CALENDAR: 'calendarScreen',
  AFFIRMATION: 'affirmationScreen',
  STATS: 'statsScreen'
};

/**
 * 指定された画面のみを表示（他は全て非表示）
 */
function showScreen(screenId) {
  console.log(`🔄 画面切り替え: ${screenId}`);
  
  // 全画面を非表示
  Object.values(SCREENS).forEach(id => {
    const screen = document.getElementById(id);
    if (screen) {
      screen.style.display = 'none';
    }
  });
  
  // 指定画面のみ表示
  const targetScreen = document.getElementById(screenId);
  if (targetScreen) {
    targetScreen.style.display = 'block';
  } else {
    console.error(`❌ 画面が見つかりません: ${screenId}`);
  }
}

// 各画面表示の便利関数
function showLoginScreen() {
  showScreen(SCREENS.LOGIN);
}

function showSetupScreen() {
  showScreen(SCREENS.SETUP);
}

function showCalendar() {
  showScreen(SCREENS.CALENDAR);
  
  // レベルコンプリート確認
  const justCompletedLevel = localStorage.getItem('justCompletedLevel');
  if (justCompletedLevel) {
    localStorage.removeItem('justCompletedLevel');
    setTimeout(() => window.showLevelCompletionModal?.(justCompletedLevel), 500);
  }
  
  window.renderCalendar?.();
}

function showAffirmationScreen() {
  showScreen(SCREENS.AFFIRMATION);
}

function showStatsScreen() {
  showScreen(SCREENS.STATS);
  window.loadAndDisplayStats?.();
}

// グローバルに公開
window.SCREENS = SCREENS;
window.showScreen = showScreen;
window.showLoginScreen = showLoginScreen;
window.showSetupScreen = showSetupScreen;
window.showCalendar = showCalendar;
window.showAffirmationScreen = showAffirmationScreen;
window.showStatsScreen = showStatsScreen;