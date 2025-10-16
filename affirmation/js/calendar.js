// カレンダー表示機能

// カレンダーをレンダリング
function renderCalendar() {
  const weeklyData = window.appState.weeklyData;
  if (!weeklyData) {
    console.error('週データがありません');
    return;
  }
  
  // 週の範囲を表示
  const weekRange = window.utils.getWeekRange(weeklyData.weekStartDate);
  document.getElementById('weekRange').textContent = weekRange.display;
  
  // カレンダーコンテナを取得
  const calendar = document.getElementById('calendar');
  calendar.innerHTML = '';
  
  // 7日分のセルを作成
  weeklyData.weeklyCards.forEach((day, index) => {
    const cell = createCalendarCell(day, index);
    calendar.appendChild(cell);
  });
}

// カレンダーセルを作成
function createCalendarCell(day, index) {
  const cell = document.createElement('div');
  cell.className = 'calendar-cell';
  
  const today = new Date().toISOString().split('T')[0];
  const cellDate = day.date;
  
  // 今日の日付
  if (cellDate === today) {
    cell.classList.add('today');
  }
  
  // 完了済み
  if (day.completed) {
    cell.classList.add('completed');
  }
  
  // 未来の日付
  if (cellDate > today) {
    cell.classList.add('future');
  }
  
  // クリック可能かどうか
  const isClickable = cellDate <= today && !day.completed;
  if (!isClickable) {
    cell.classList.add('disabled');
  }
  
  // セルの内容
  const dayLabel = window.utils.getDayLabel(cellDate);
  const dateLabel = window.utils.formatDate(cellDate);
  
  cell.innerHTML = `
    <div class="calendar-cell-header">
      <div class="day-label">${dayLabel}</div>
      <div class="date-label">${dateLabel}</div>
    </div>
    <div class="calendar-cell-body">
      <div class="card-icon">${day.completed ? '✅' : window.getThemeEmoji()}</div>
    </div>
    <div class="calendar-cell-footer">
      <div class="affirmation-count">${day.affirmations.length}文</div>
    </div>
  `;
  
  // クリックイベント
  if (isClickable) {
    cell.addEventListener('click', () => {
      openAffirmationScreen(index);
    });
    cell.style.cursor = 'pointer';
  }
  
  return cell;
}

// アファメーション画面を開く
function openAffirmationScreen(dayIndex) {
  window.appState.currentDayIndex = dayIndex;
  window.appState.currentAffirmationIndex = 0;
  window.appState.recordings = [];
  window.appState.isRecording = false;
  
  // 画面を切り替え
  document.getElementById('setupScreen').style.display = 'none';
  document.getElementById('calendarScreen').style.display = 'none';
  document.getElementById('affirmationScreen').style.display = 'block';
  document.getElementById('statsScreen').style.display = 'none';
  
  // アファメーションを表示
  window.renderAffirmation();
}

// グローバルに公開
window.renderCalendar = renderCalendar;
window.openAffirmationScreen = openAffirmationScreen;