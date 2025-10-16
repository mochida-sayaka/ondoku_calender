// ==============================================
// シェア機能（Twitter + 画像DL）
// ==============================================

/**
 * 完了サマリーからシェアモーダルを開く
 */
function openShareModalFromCompletion() {
  const modal = document.getElementById('shareModal');
  modal.style.display = 'flex';
  
  // シェアボタンにイベントリスナーを設定
  const shareButtons = document.querySelectorAll('.share-option-btn');
  shareButtons.forEach(btn => {
    btn.onclick = () => handleSharePlatform(btn.dataset.platform);
  });
}

/**
 * シェアモーダルを閉じる
 */
function closeShareModal() {
  const modal = document.getElementById('shareModal');
  modal.style.display = 'none';
}

/**
 * 各プラットフォームへのシェア
 */
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
    case 'download':
      await downloadAffirmationImage(day.affirmations);
      break;
  }
  
  closeShareModal();
}

/**
 * Twitterにシェア
 */
function shareToTwitter(text, url) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  window.open(twitterUrl, '_blank', 'width=600,height=400');
}

/**
 * レポート画像をダウンロード
 */
async function downloadAffirmationImage(affirmations) {
  try {
    // 統計データを取得
    const stats = await getStatsForImage();
    
    // Canvas作成
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    
    // テーマを取得
    const theme = window.getCurrentTheme();
    const themeEmoji = window.getThemeEmoji();

    // 背景（グラデーション）
    const gradient = ctx.createLinearGradient(0, 0, 0, 1080);
    gradient.addColorStop(0, theme.canvasColors.gradientStart);
    gradient.addColorStop(1, theme.canvasColors.gradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1080, 1080);

    // 白い半透明のカード
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    roundRect(ctx, 60, 60, 960, 960, 30);
    ctx.fill();

    // タイトル
    ctx.fillStyle = theme.canvasColors.textDark;
    ctx.font = 'bold 50px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${themeEmoji} Today's Affirmation`, 540, 150);

    // 日付
    ctx.fillStyle = theme.canvasColors.textLight;
    ctx.font = '30px "Arial", sans-serif';
    const date = new Date();
    const dateStr = `${date.getMonth() + 1}/${date.getDate()} (${['日', '月', '火', '水', '木', '金', '土'][date.getDay()]})`;
    ctx.fillText(dateStr, 540, 200);

    // 区切り線
    ctx.strokeStyle = theme.canvasColors.textLight;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(150, 230);
    ctx.lineTo(930, 230);
    ctx.stroke();

    // アファメーション（英語 + 日本語）
    let yPos = 280;
    affirmations.forEach((aff, index) => {
      // 英語
      ctx.fillStyle = theme.canvasColors.textDark;
      ctx.font = 'bold 38px "Arial", sans-serif';
      ctx.textAlign = 'center';
      
      const prefix = affirmations.length > 1 ? `${index + 1}. ` : '';
      const engLines = wrapText(ctx, prefix + aff.text, 850);
      engLines.forEach(line => {
        ctx.fillText(line, 540, yPos);
        yPos += 50;
      });

      // 日本語
      ctx.fillStyle = theme.canvasColors.textLight;
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
    ctx.fillStyle = 'rgba(243, 229, 245, 0.5)'; // 薄い背景
    roundRect(ctx, 150, statsY, 780, statsHeight, 20);
    ctx.fill();

    // 統計タイトル
    ctx.fillStyle = theme.canvasColors.textDark;
    ctx.font = 'bold 35px "Arial", sans-serif';
    ctx.fillText(`${themeEmoji} My Progress`, 540, statsY + 60);

    // 統計データ
    ctx.font = '28px "Arial", sans-serif';
    ctx.fillStyle = theme.canvasColors.textLight;
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
    ctx.fillStyle = theme.canvasColors.textLight;
    ctx.font = '24px "Arial", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${themeEmoji} Affirmation Calendar`, 540, 1020);

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

/**
 * 画像用の統計データを取得
 */
async function getStatsForImage() {
  try {
    // Firestoreから録音データを取得
    const recordings = await window.fetchUserStats(window.appState.studentName);
    
    // stats.js の関数を使用
    if (window.calculateStats) {
      return window.calculateStats(recordings);
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

/**
 * テキストを折り返す関数
 */
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

/**
 * roundRect のポリフィル（Canvas API）
 */
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
window.openShareModalFromCompletion = openShareModalFromCompletion;
window.closeShareModal = closeShareModal;
window.downloadAffirmationImage = downloadAffirmationImage;