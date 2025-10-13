// 統計機能

// 統計データを読み込んで表示
async function loadAndDisplayStats() {
  try {
    console.log('📊 統計データ読み込み開始');
    
    // Firestoreから録音データを取得
    const recordings = await window.fetchUserStats(window.appState.studentName);
    
    // 統計を計算
    const stats = calculateStats(recordings);
    
    // 表示
    displayStats(stats);
    
    console.log('✅ 統計表示完了', stats);
  } catch (error) {
    console.error('統計読み込みエラー:', error);
    displayEmptyStats();
  }
}

// 統計を計算
function calculateStats(recordings) {
  const stats = {
    totalDays: 0,
    totalAffirmations: 0,
    totalDuration: 0,
    currentStreak: 0,
    longestStreak: 0,
    levelStats: { easy: 0, intermediate: 0, advanced: 0 },
    moodStats: { gentle: 0, uplifting: 0, empowering: 0, balanced: 0 },
    history: [],
    badges: []
  };
  
  if (recordings.length === 0) {
    return stats;
  }
  
  const dateSet = new Set();
  
  // データを集計
  recordings.forEach(record => {
    // 日付をカウント
    dateSet.add(record.date);
    
    // 文数をカウント
    if (record.files && Array.isArray(record.files)) {
      stats.totalAffirmations += record.files.length;
    }
    
    // レベル別カウント
    if (record.settings && record.settings.level) {
      const count = record.files ? record.files.length : 0;
      stats.levelStats[record.settings.level] += count;
    }
    
    // ムード別カウント
    if (record.settings && record.settings.mood) {
      const count = record.files ? record.files.length : 0;
      stats.moodStats[record.settings.mood] += count;
    }
    
    // 履歴に追加
    stats.history.push({
      date: record.date,
      count: record.files ? record.files.length : 0
    });
  });
  
  stats.totalDays = dateSet.size;
  
  // 総録音時間を推定（1文30秒）
  stats.totalDuration = stats.totalAffirmations * 30;
  
  // 連続記録を計算
  const streaks = calculateStreaks(stats.history);
  stats.currentStreak = streaks.current;
  stats.longestStreak = streaks.longest;
  
  // バッジを計算
  stats.badges = calculateBadges(stats);
  
  return stats;
}

// 連続記録を計算
function calculateStreaks(history) {
  if (history.length === 0) {
    return { current: 0, longest: 0 };
  }
  
  // 日付でソート（重複除去）
  const sortedDates = [...new Set(history.map(h => h.date))].sort();
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 1;
  
  // 現在の連続記録を計算
  if (sortedDates.includes(today) || sortedDates.includes(yesterday)) {
    currentStreak = 1;
    
    for (let i = 1; i < 365; i++) {
      const checkDate = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      if (sortedDates.includes(checkDate)) {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  
  // 最長連続記録を計算
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    const diffDays = Math.floor((currDate - prevDate) / (24 * 60 * 60 * 1000));
    
    if (diffDays === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);
  
  return { current: currentStreak, longest: longestStreak };
}

// バッジを計算
function calculateBadges(stats) {
  const badges = [];
  
  if (stats.totalAffirmations >= 1) badges.push('first_recording');
  if (stats.currentStreak >= 7) badges.push('7_day_streak');
  if (stats.currentStreak >= 30) badges.push('30_day_streak');
  if (stats.totalAffirmations >= 50) badges.push('50_affirmations');
  if (stats.totalAffirmations >= 100) badges.push('100_affirmations');
  if (stats.levelStats.easy > 0 && stats.levelStats.intermediate > 0 && stats.levelStats.advanced > 0) {
    badges.push('all_levels');
  }
  
  return badges;
}

// 統計を表示
function displayStats(stats) {
  const container = document.getElementById('statsContainer');
  container.innerHTML = '';
  
  // 連続記録カード
  container.appendChild(createStreakCard(stats));
  
  // 今週の完了率カード
  container.appendChild(createWeekCompletionCard());
  
  // 累計学習カード
  container.appendChild(createTotalStatsCard(stats));
  
  // レベル別進捗カード
  container.appendChild(createLevelStatsCard(stats));
  
  // 気分別傾向カード
  container.appendChild(createMoodStatsCard(stats));
  
  // バッジカード
  container.appendChild(createBadgesCard(stats.badges));
}

// 連続記録カード
function createStreakCard(stats) {
  const card = document.createElement('div');
  card.className = 'stat-card streak-card';
  card.innerHTML = `
    <div class="stat-icon">🔥</div>
    <div class="stat-content">
      <div class="stat-label">連続記録</div>
      <div class="stat-value">${stats.currentStreak}日間</div>
      <div class="stat-sublabel">最長記録: ${stats.longestStreak}日</div>
    </div>
  `;
  return card;
}

// 今週の完了率カード
function createWeekCompletionCard() {
  const card = document.createElement('div');
  card.className = 'stat-card';
  
  let completed = 0;
  let total = 7;
  let percentage = 0;
  
  if (window.appState.weeklyData) {
    completed = window.appState.weeklyData.weeklyCards.filter(d => d.completed).length;
    total = window.appState.weeklyData.weeklyCards.length;
    percentage = Math.round((completed / total) * 100);
  }
  
  card.innerHTML = `
    <div class="stat-label">✅ 今週の完了率</div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${percentage}%"></div>
    </div>
    <div class="stat-sublabel">${percentage}% (${completed}/${total}日)</div>
  `;
  return card;
}

// 累計学習カード
function createTotalStatsCard(stats) {
  const hours = Math.floor(stats.totalDuration / 3600);
  const minutes = Math.floor((stats.totalDuration % 3600) / 60);
  const timeStr = `${hours}:${minutes.toString().padStart(2, '0')}`;
  
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.innerHTML = `
    <div class="stat-label">📚 累計学習</div>
    <div class="stat-grid">
      <div class="stat-item">
        <div class="stat-number">${stats.totalDays}</div>
        <div class="stat-unit">日</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${stats.totalAffirmations}</div>
        <div class="stat-unit">文</div>
      </div>
      <div class="stat-item">
        <div class="stat-number">${timeStr}</div>
        <div class="stat-unit">時間</div>
      </div>
    </div>
  `;
  return card;
}

// レベル別進捗カード
function createLevelStatsCard(stats) {
  const total = stats.levelStats.easy + stats.levelStats.intermediate + stats.levelStats.advanced;
  const easyPercent = total > 0 ? Math.round((stats.levelStats.easy / total) * 100) : 0;
  const intermediatePercent = total > 0 ? Math.round((stats.levelStats.intermediate / total) * 100) : 0;
  const advancedPercent = total > 0 ? Math.round((stats.levelStats.advanced / total) * 100) : 0;
  
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.innerHTML = `
    <div class="stat-label">📈 レベル別進捗</div>
    <div class="level-stats">
      <div class="level-bar">
        <div class="level-info">
          <span>初級</span>
          <span>${stats.levelStats.easy}文</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill level-easy" style="width: ${easyPercent}%"></div>
        </div>
      </div>
      <div class="level-bar">
        <div class="level-info">
          <span>中級</span>
          <span>${stats.levelStats.intermediate}文</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill level-intermediate" style="width: ${intermediatePercent}%"></div>
        </div>
      </div>
      <div class="level-bar">
        <div class="level-info">
          <span>上級</span>
          <span>${stats.levelStats.advanced}文</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill level-advanced" style="width: ${advancedPercent}%"></div>
        </div>
      </div>
    </div>
  `;
  return card;
}

// 気分別傾向カード
function createMoodStatsCard(stats) {
  const total = stats.moodStats.gentle + stats.moodStats.uplifting + 
                stats.moodStats.empowering + stats.moodStats.balanced;
  
  const gentlePercent = total > 0 ? Math.round((stats.moodStats.gentle / total) * 100) : 0;
  const upliftingPercent = total > 0 ? Math.round((stats.moodStats.uplifting / total) * 100) : 0;
  const empoweringPercent = total > 0 ? Math.round((stats.moodStats.empowering / total) * 100) : 0;
  const balancedPercent = total > 0 ? Math.round((stats.moodStats.balanced / total) * 100) : 0;
  
  const card = document.createElement('div');
  card.className = 'stat-card';
  card.innerHTML = `
    <div class="stat-label">🎭 気分別傾向</div>
    <div class="mood-stats">
      <div class="mood-item">
        <span class="mood-icon">🌸</span>
        <span class="mood-name">Gentle</span>
        <div class="mood-bar">
          <div class="mood-fill mood-gentle" style="width: ${gentlePercent}%"></div>
        </div>
        <span class="mood-percent">${gentlePercent}%</span>
      </div>
      <div class="mood-item">
        <span class="mood-icon">🚀</span>
        <span class="mood-name">Uplifting</span>
        <div class="mood-bar">
          <div class="mood-fill mood-uplifting" style="width: ${upliftingPercent}%"></div>
        </div>
        <span class="mood-percent">${upliftingPercent}%</span>
      </div>
      <div class="mood-item">
        <span class="mood-icon">💪</span>
        <span class="mood-name">Empowering</span>
        <div class="mood-bar">
          <div class="mood-fill mood-empowering" style="width: ${empoweringPercent}%"></div>
        </div>
        <span class="mood-percent">${empoweringPercent}%</span>
      </div>
      <div class="mood-item">
        <span class="mood-icon">🌈</span>
        <span class="mood-name">Balanced</span>
        <div class="mood-bar">
          <div class="mood-fill mood-balanced" style="width: ${balancedPercent}%"></div>
        </div>
        <span class="mood-percent">${balancedPercent}%</span>
      </div>
    </div>
  `;
  return card;
}

// バッジカード
function createBadgesCard(unlockedBadges) {
  const allBadges = [
    { id: 'first_recording', icon: '🌟', name: '初めての録音' },
    { id: '7_day_streak', icon: '🔥', name: '7日連続' },
    { id: '30_day_streak', icon: '💎', name: '30日連続' },
    { id: '50_affirmations', icon: '📚', name: '50文完了' },
    { id: '100_affirmations', icon: '🏆', name: '100文完了' },
    { id: 'all_levels', icon: '🎓', name: '全レベル制覇' }
  ];
  
  const card = document.createElement('div');
  card.className = 'stat-card';
  
  const badgesHtml = allBadges.map(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    return `
      <div class="badge ${isUnlocked ? 'unlocked' : 'locked'}">
        <div class="badge-icon">${badge.icon}</div>
        <div class="badge-name">${badge.name}</div>
      </div>
    `;
  }).join('');
  
  card.innerHTML = `
    <div class="stat-label">🏆 達成バッジ</div>
    <div class="badges-grid">${badgesHtml}</div>
  `;
  return card;
}

// 空の統計を表示
function displayEmptyStats() {
  const container = document.getElementById('statsContainer');
  container.innerHTML = `
    <div class="stat-card">
      <div class="stat-label">まだ録音がありません</div>
      <p>カレンダーから今日のアファメーションを録音してみましょう！</p>
    </div>
  `;
}

// グローバルに公開
window.loadAndDisplayStats = loadAndDisplayStats;