// 月間カレンダー表示機能

// 現在表示中の年月
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth(); // 0-11

// カレンダーをレンダリング
function renderCalendar() {
  const weeklyData = window.appState.weeklyData;
  if (!weeklyData) {
    console.error('週データがありません');
    return;
  }
  
  // 月のタイトルを更新
  updateMonthTitle();
  
  // カレンダーグリッドを生成
  generateCalendarGrid();
  
  // ナビゲーションボタンの状態を更新
  updateNavigationButtons();
}

// 月のタイトルを更新
function updateMonthTitle() {
  const monthTitle = document.getElementById('monthTitle');
  if (monthTitle) {
    monthTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
  }
}

// カレンダーグリッドを生成
function generateCalendarGrid() {
  const calendar = document.getElementById('calendar');
  if (!calendar) {
    console.error('カレンダー要素が見つかりません');
    return;
  }
  
  calendar.innerHTML = '';
  
  // 月の最初の日と最後の日
  const firstDay = new Date(currentYear, currentMonth, 1);
  const lastDay = new Date(currentYear, currentMonth + 1, 0);
  
  // 月の最初の日の曜日（0=日, 1=月, ...）
  let firstDayOfWeek = firstDay.getDay();
  if (firstDayOfWeek === 0) firstDayOfWeek = 7; // 日曜日を7に
  
  // 前月の日付を埋める（月曜日始まり）
  const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
  for (let i = firstDayOfWeek - 1; i > 0; i--) {
    const cell = createEmptyCell(prevMonthLastDay - i + 1, true);
    calendar.appendChild(cell);
  }
  
  // 今月の日付
  for (let day = 1; day <= lastDay.getDate(); day++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const cell = createCalendarCell(dateStr, day);
    calendar.appendChild(cell);
  }
  
  // 次月の日付を埋める（グリッドを埋めるため）
  const totalCells = calendar.children.length;
  const remainingCells = 42 - totalCells; // 6週間分
  for (let day = 1; day <= remainingCells; day++) {
    const cell = createEmptyCell(day, true);
    calendar.appendChild(cell);
  }
}

// 空セルを作成（前月・次月）
function createEmptyCell(day, isOtherMonth) {
  const cell = document.createElement('div');
  cell.className = 'calendar-cell other-month';
  cell.innerHTML = `<div class="cell-date">${day}</div>`;
  return cell;
}

// カレンダーセルを作成
function createCalendarCell(dateStr, day) {
  const cell = document.createElement('div');
  cell.className = 'calendar-cell';
  
  const weeklyData = window.appState.weeklyData;
  const today = window.getLocalDateString();
  
  // この日のデータを探す
  const dayData = weeklyData.weeklyCards.find(d => d.date === dateStr);
  
  if (dayData) {
    // ステータスを判定
    const status = getDateStatus(dayData);
    cell.classList.add(status);
    
    // アイコンを決定
    const icon = getStatusIcon(status);
    
    // クリック可能かどうか
    const isClickable = canAccessDate(dateStr, status);
    if (!isClickable) {
      cell.classList.add('disabled');
    }
    
    // 今日かどうか（disabledより後に追加して優先）
    if (dateStr === today) {
      cell.classList.add('today');
      console.log('✅ 今日のセルを発見:', dateStr);
    }
    
    // 抽選週かどうか
    if (isInCurrentWeek(dateStr)) {
      cell.classList.add('current-week');
    }
    
    // セルの内容
    cell.innerHTML = `
      <div class="cell-date">${day}</div>
      <div class="cell-icon">${icon}</div>
    `;
    
    // クリックイベント
    if (isClickable) {
      const dayIndex = weeklyData.weeklyCards.findIndex(d => d.date === dateStr);
      cell.addEventListener('click', () => {
        openAffirmationScreen(dayIndex);
      });
    }
  } else {
    // 抽選されていない日
    cell.classList.add('disabled');
    cell.innerHTML = `
      <div class="cell-date">${day}</div>
      <div class="cell-icon">--</div>
    `;
  }
  
  return cell;
}

// 抽選週かどうか判定
function isInCurrentWeek(dateStr) {
  const weeklyData = window.appState.weeklyData;
  if (!weeklyData) return false;
  
  const weekStart = new Date(weeklyData.weekStartDate);
  const weekEnd = new Date(weeklyData.weekEndDate);
  const date = new Date(dateStr);
  
  return date >= weekStart && date <= weekEnd;
}

// ステータスを判定
function getDateStatus(dayData) {
  if (dayData.deletedAt) return 'expired';
  if (dayData.completed) return 'completed';
  
  // affirmations に recorded フィールドがあるか確認
  if (dayData.affirmations && dayData.affirmations.length > 0) {
    const totalCount = dayData.affirmations.length;
    const completedCount = dayData.affirmations.filter(a => a.recorded).length;
    
    if (completedCount === totalCount) return 'completed';
    if (completedCount > 0) return 'partial';
  }
  
  return 'incomplete';
}

// ステータスアイコン
function getStatusIcon(status) {
  const icons = {
    'completed': '✅',
    'partial': '⚠️',
    'incomplete': '⭕',
    'expired': '💎'
  };
  return icons[status] || '🌸';
}

// 日付にアクセス可能かどうか
function canAccessDate(dateStr, status) {
  // 今日の日付を文字列形式で取得
  const todayStr = window.getLocalDateString();
  const weeklyData = window.appState.weeklyData;
  const weekEnd = weeklyData.weekEndDate;
  
  // 💎期限切れ（アーカイブ）データは常に閲覧可能
  if (status === 'expired') return true;
  
  // 未来の日付はアクセス不可
  if (dateStr > todayStr) return false;
  
  // 抽選週が終わっている場合
  if (todayStr > weekEnd) {
    // 完了済みなら閲覧可能
    if (status === 'completed') return true;
    // 未完了は閲覧不可
    return false;
  }
  
  // 抽選週内で今日以前ならアクセス可能
  return dateStr >= weeklyData.weekStartDate && dateStr <= todayStr;
}

// ナビゲーションボタンの状態を更新
function updateNavigationButtons() {
  const weeklyData = window.appState.weeklyData;
  if (!weeklyData) return;
  
  const firstDrawDate = new Date(weeklyData.weekStartDate);
  const firstDrawYear = firstDrawDate.getFullYear();
  const firstDrawMonth = firstDrawDate.getMonth();
  
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  
  const prevBtn = document.getElementById('prevMonthBtn');
  const nextBtn = document.getElementById('nextMonthBtn');
  
  if (!prevBtn || !nextBtn) {
    console.error('❌ ナビゲーションボタンが見つかりません');
    return;
  }
  
  // 前月ボタン: 最初の抽選月より前は無効
  if (currentYear < firstDrawYear || 
      (currentYear === firstDrawYear && currentMonth < firstDrawMonth)) {
    prevBtn.disabled = true;
  } else {
    prevBtn.disabled = false;
  }
  
  // 次月ボタン: 今月より先は無効
  if (currentYear > todayYear || 
      (currentYear === todayYear && currentMonth > todayMonth)) {
    nextBtn.disabled = true;
  } else {
    nextBtn.disabled = false;
  }
  
  console.log(`🔘 ナビゲーション: 前月=${!prevBtn.disabled}, 次月=${!nextBtn.disabled}, 表示中=${currentYear}/${currentMonth+1}`);
}

// 前月へ
function goToPrevMonth() {
  const weeklyData = window.appState.weeklyData;
  if (!weeklyData) return;
  
  const firstDrawDate = new Date(weeklyData.weekStartDate);
  const firstDrawYear = firstDrawDate.getFullYear();
  const firstDrawMonth = firstDrawDate.getMonth();
  
  // 前月を計算
  let prevMonth = currentMonth - 1;
  let prevYear = currentYear;
  
  if (prevMonth < 0) {
    prevMonth = 11;
    prevYear--;
  }
  
  // 最初の抽選月より前には行けない
  if (prevYear < firstDrawYear || 
      (prevYear === firstDrawYear && prevMonth < firstDrawMonth)) {
    console.log('⚠️ これより前の月には移動できません');
    return;
  }
  
  currentMonth = prevMonth;
  currentYear = prevYear;
  renderCalendar();
  console.log(`📅 前月へ移動: ${currentYear}年${currentMonth + 1}月`);
}

// 次月へ
function goToNextMonth() {
  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth();
  
  // 次月を計算
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  
  if (nextMonth > 11) {
    nextMonth = 0;
    nextYear++;
  }
  
  // 今月より先には行けない
  if (nextYear > todayYear || 
      (nextYear === todayYear && nextMonth > todayMonth)) {
    console.log('⚠️ 未来の月には移動できません');
    return;
  }
  
  currentMonth = nextMonth;
  currentYear = nextYear;
  renderCalendar();
  console.log(`📅 次月へ移動: ${currentYear}年${currentMonth + 1}月`);
}

// 今月に戻る
function goToThisMonth() {
  const today = new Date();
  currentYear = today.getFullYear();
  currentMonth = today.getMonth();
  renderCalendar();
  console.log(`📅 今月へ移動: ${currentYear}年${currentMonth + 1}月`);
}

// アファメーション画面を開く
function openAffirmationScreen(dayIndex) {
  window.appState.currentDayIndex = dayIndex;
  window.appState.currentAffirmationIndex = 0;
  window.appState.recordings = [];
  window.appState.isRecording = false;
  
  // 画面を切り替え
  document.getElementById('calendarScreen').style.display = 'none';
  document.getElementById('affirmationScreen').style.display = 'block';
  
  // アファメーションを表示
  window.renderAffirmation();
}

// グローバルに公開
window.renderCalendar = renderCalendar;
window.goToPrevMonth = goToPrevMonth;
window.goToNextMonth = goToNextMonth;
window.goToThisMonth = goToThisMonth;
window.openAffirmationScreen = openAffirmationScreen;