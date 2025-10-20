// アファメーション表示機能

// アファメーションをレンダリング
function renderAffirmation() {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  const index = window.appState.currentAffirmationIndex;
  const affirmation = day.affirmations[index];
  
  if (!affirmation) {
    console.error('アファメーションが見つかりません');
    return;
  }
  
  // 日付を表示
  const dateLabel = window.utils.formatDate(day.date);
  const dayLabel = window.utils.getDayLabel(day.date);
  document.getElementById('affirmationDate').textContent = 
    `${dateLabel} (${dayLabel})`;
  
  // アファメーションを表示
  document.getElementById('affirmationText').textContent = affirmation.text;
  document.getElementById('affirmationJapanese').textContent = affirmation.japanese;
  document.getElementById('affirmationJapanese').style.display = 'none';
  document.getElementById('toggleJapanese').textContent = '日本語を表示';
  
  // ページネーションを表示
  renderPagination(day.affirmations.length, index);
  
  // 🔧 修正: この文の録音があるか確認
  const recording = window.appState.recordings[index];
  if (recording) {
    // 録音済み → プレイヤーを表示
    const audioUrl = URL.createObjectURL(recording);
    document.getElementById('recordingAudio').src = audioUrl;
    document.getElementById('recordingPlayer').style.display = 'block';
  } else {
    // 🔧 修正: この文の録音があるか確認
    const recording = window.appState.recordings[index];
    if (recording) {
      // 録音済み → プレイヤーを表示
      const audioUrl = URL.createObjectURL(recording);
      document.getElementById('recordingAudio').src = audioUrl;
      document.getElementById('recordingPlayer').style.display = 'block';
    } else {
      // 未録音 → プレイヤーを非表示
      document.getElementById('recordingPlayer').style.display = 'none';
      document.getElementById('recordingAudio').src = '';
    }
  }
  
  // 録音ボタンをリセット
  const recordBtn = document.getElementById('recordBtn');
  recordBtn.innerHTML = '<span class="btn-icon">🎤</span><span>録音する</span>';
  recordBtn.removeAttribute('style');
  
  // 完了ボタンの表示制御
  updateCompleteButton();
}

// ページネーションをレンダリング
function renderPagination(total, current) {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  if (total <= 1) {
    return; // 1文の場合は表示しない
  }
  
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('button');
    dot.className = 'pagination-dot';
    if (i === current) {
      dot.classList.add('active');
    }
    dot.addEventListener('click', () => {
      navigateToAffirmation(i);
    });
    pagination.appendChild(dot);
  }
  
  // 前へ・次へボタン
  if (current > 0) {
    const prevBtn = document.createElement('button');
    prevBtn.className = 'pagination-btn';
    prevBtn.textContent = '← 前へ';
    prevBtn.addEventListener('click', () => {
      navigateToAffirmation(current - 1);
    });
    pagination.prepend(prevBtn);
  }
  
  if (current < total - 1) {
    const nextBtn = document.createElement('button');
    nextBtn.className = 'pagination-btn';
    nextBtn.textContent = '次へ →';
    nextBtn.addEventListener('click', () => {
      navigateToAffirmation(current + 1);
    });
    pagination.appendChild(nextBtn);
  }
}

// アファメーションを切り替え
function navigateToAffirmation(index) {
  window.appState.currentAffirmationIndex = index;
  renderAffirmation();
}

// 完了ボタンの表示制御
function updateCompleteButton() {
  const day = window.appState.weeklyData.weeklyCards[window.appState.currentDayIndex];
  const totalAffirmations = day.affirmations.length;
  const recordedCount = window.appState.recordings.filter(r => r).length;
  
  const completeBtn = document.getElementById('completeBtn');
  
  if (recordedCount > 0) {
    completeBtn.style.display = 'block';
    completeBtn.textContent = `✨ 完了して送信 (${recordedCount}/${totalAffirmations}文)`;
  } else {
    completeBtn.style.display = 'none';
  }
}

// 録音プレーヤーを表示
function showRecordingPlayer(audioBlob, index) {
  const audioUrl = URL.createObjectURL(audioBlob);
  document.getElementById('recordingAudio').src = audioUrl;
  document.getElementById('recordingPlayer').style.display = 'block';
  
  // 完了ボタンを更新
  updateCompleteButton();
}

// グローバルに公開
window.renderAffirmation = renderAffirmation;
window.navigateToAffirmation = navigateToAffirmation;
window.updateCompleteButton = updateCompleteButton;
window.showRecordingPlayer = showRecordingPlayer;