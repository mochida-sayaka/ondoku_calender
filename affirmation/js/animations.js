// ==============================================
// カード引く演出アニメーション（GSAP版）
// ==============================================

/**
 * ローディングオーバーレイを作成
 */
function createLoadingOverlay() {
  const overlay = document.createElement('div');
  overlay.className = 'loading-overlay';
  overlay.innerHTML = `
    <div class="magic-circle">
      <div class="magic-icon">🌟</div>
    </div>
    <div class="loading-text">カードを引いています...</div>
    <button class="skip-animation-btn">スキップ ⏭️</button>
  `;
  return overlay;
}

/**
 * 指定ミリ秒待つ
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * カード引く演出を表示（GSAP版）
 * @param {Function} callback - アニメーション完了後に実行する関数
 */
async function showCardDrawAnimation(callback) {
  console.log('🎬 アニメーション開始');
  console.log('GSAP存在チェック:', typeof gsap !== 'undefined');
  
  // GSAPが読み込まれているか確認
  if (typeof gsap === 'undefined') {
    console.error('❌ GSAPが読み込まれていません');
    alert('アニメーションの準備中です。もう一度試してください。');
    if (callback) await callback();
    return;
  }
  
  // ローディングオーバーレイを作成
  const overlay = createLoadingOverlay();
  document.body.appendChild(overlay);
  
  // スキップボタンのイベントリスナー
  let isSkipped = false;
  const skipBtn = overlay.querySelector('.skip-animation-btn');
  skipBtn.addEventListener('click', async () => {
  isSkipped = true;
  
  // すべてのアニメーションを即座に停止
  gsap.killTweensOf("*");
  
  // オーバーレイを削除
  if (overlay.parentNode) {
    overlay.remove();
  }
  
  // カード抽選を実行
  if (callback) {
    await callback();
  }
  
  // カレンダーを表示（main.jsのshowCalendar関数を呼ぶ）
  if (typeof showCalendar === 'function') {
    showCalendar();
  }
});

  console.log('⏰ フェードイン開始');

  // GSAPでオーバーレイをフェードイン
  gsap.from(overlay, {
    duration: 0.4,
    opacity: 0,
    ease: "power2.out"
  });
  
  console.log('⏰ sleep(400) 開始');
  await sleep(400);
  console.log('⏰ sleep(400) 完了');
  
  // ステップ1: 魔法陣をアニメーション
  console.log('🎨 ステップ1: 魔法陣開始');
  animateMagicCircle(overlay);

  // ステップ2: カウントダウン（3, 2, 1）
  console.log('🎨 ステップ2: カウントダウン開始');
  await showCountdownGSAP(overlay);
  console.log('🎨 ステップ2: カウントダウン完了');

  // ステップ3: カードシャッフル演出
  console.log('🎨 ステップ3: カードシャッフル開始');
  await showCardShuffleGSAP(overlay);
  console.log('🎨 ステップ3: カードシャッフル完了');
  
  // ステップ4: キラキラエフェクト
  createSparklesGSAP(overlay, 30);
  
  // ステップ5: 完了メッセージ
  await showCompletionMessageGSAP(overlay);
  
 // ステップ6: 実際のカード抽選処理（スキップされていない場合のみ実行）
if (!isSkipped && callback) {
  await callback();
}
  
  // ステップ7: フェードアウトしてオーバーレイを削除
  await gsap.to(overlay, {
    duration: 0.6,
    opacity: 0,
    ease: "power2.in"
  });
  
  // 存在確認してから削除
  if (overlay.parentNode) {
    document.body.removeChild(overlay);
  }
}

/**
 * 魔法陣をアニメーション
 */
function animateMagicCircle(overlay) {
  const magicCircle = overlay.querySelector('.magic-circle');
  const magicIcon = overlay.querySelector('.magic-icon');
  
  // 魔法陣を回転
  gsap.to(magicCircle, {
    duration: 2,
    rotation: 360,
    repeat: -1,
    ease: "none"
  });
  
  // アイコンをパルス
  gsap.to(magicIcon, {
    duration: 1,
    scale: 1.2,
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });
  
  // 魔法陣を輝かせる
  gsap.to(magicCircle, {
    duration: 1.5,
    boxShadow: "0 0 100px rgba(255, 255, 255, 0.8), 0 0 150px rgba(255, 215, 0, 0.6)",
    repeat: -1,
    yoyo: true,
    ease: "power1.inOut"
  });
}

/**
 * カウントダウン表示（GSAP版）
 */
async function showCountdownGSAP(overlay) {
  console.log('⏱️ カウントダウン関数開始');
  for (let i = 3; i > 0; i--) {
    console.log(`⏱️ カウント: ${i}`);
    const countdownNum = document.createElement('div');
    countdownNum.className = 'countdown-number';
    countdownNum.textContent = i;
    countdownNum.style.opacity = '0';
    countdownNum.style.transform = 'scale(0)';
    overlay.appendChild(countdownNum);
    
    console.log(`⏱️ ${i}: GSAP登場開始`);
    const startTime = Date.now();
    
    await gsap.to(countdownNum, {
      duration: 0.4,
      opacity: 1,
      scale: 1.3,
      ease: "back.out(3)"
    });
    
    const gsapTime = Date.now() - startTime;
    console.log(`⏱️ ${i}: GSAP登場完了（実測: ${gsapTime}ms）`);
    
    console.log(`⏱️ ${i}: sleep(600)開始`);
    const sleepStart = Date.now();
    
    await sleep(400);
    
    const sleepTime = Date.now() - sleepStart;
    console.log(`⏱️ ${i}: sleep完了（実測: ${sleepTime}ms）`);
    
    await gsap.to(countdownNum, {
      duration: 0.3,
      opacity: 0,
      scale: 0.5,
      ease: "power2.in"
    });
    
    overlay.removeChild(countdownNum);
  }
}

/**
 * カードシャッフル演出（GSAP版）
 */
async function showCardShuffleGSAP(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  
  // テキストをアニメーション
  gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0,
    onComplete: () => {
      loadingText.textContent = 'シャッフル中...';
      gsap.to(loadingText, {
        duration: 0.3,
        opacity: 1
      });
    }
  });
  
  await sleep(500);
  
  // カードを5枚生成
  const cards = [];
  const cardPositions = [15, 30, 45, 60, 75];
  
  for (let i = 0; i < 5; i++) {
    const card = document.createElement('div');
    card.className = 'card-shuffle';
    card.style.left = `${cardPositions[i]}%`;
    card.style.top = '50%';
    card.style.opacity = '0';
    overlay.appendChild(card);
    cards.push(card);
  }
  
  // GSAPで順番に登場
  gsap.from(cards, {
    duration: 0.8,
    y: 200,
    opacity: 0,
    rotation: -30,
    scale: 0.5,
    stagger: 0.15,
    ease: "back.out(2)"
  });
  
  await sleep(1200);
  
  gsap.to(cards, {
    duration: 2,
    y: -30,
    rotation: 360,
    scale: 1.15,
    stagger: 0.12,
    ease: "elastic.out(1, 0.4)",
    repeat: 1,
    yoyo: true
  });
  
  await sleep(3500);
  
  // カードを消す
  await gsap.to(cards, {
    duration: 0.5,
    y: -100,
    opacity: 0,
    rotation: 720,
    stagger: 0.08,
    ease: "power2.in"
  });
  
  cards.forEach(card => overlay.removeChild(card));
}

/**
 * キラキラパーティクルを生成（GSAP版）
 */
function createSparklesGSAP(overlay, count = 20) {
  for (let i = 0; i < count; i++) {
    const sparkle = document.createElement('div');
    sparkle.className = 'sparkle-particle';
    sparkle.style.left = `${Math.random() * 100}%`;
    sparkle.style.top = `${Math.random() * 100}%`;
    sparkle.style.opacity = '0';
    overlay.appendChild(sparkle);
    
    // 中心からの距離を計算（放射状に広がる）
    const centerX = 50;
    const centerY = 50;
    const x = parseFloat(sparkle.style.left);
    const y = parseFloat(sparkle.style.top);
    const angle = Math.atan2(y - centerY, x - centerX);
    const distance = 100;
    
    // GSAPでアニメーション
    gsap.to(sparkle, {
      duration: 2 + Math.random(),
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
      opacity: 1,
      scale: 1.5,
      rotation: Math.random() * 360,
      ease: "power1.out",
      delay: Math.random() * 0.5,
      onComplete: () => {
        gsap.to(sparkle, {
          duration: 0.5,
          opacity: 0,
          onComplete: () => {
            if (overlay.contains(sparkle)) {
              overlay.removeChild(sparkle);
            }
          }
        });
      }
    });
  }
}

/**
 * 完了メッセージを表示（GSAP版）
 */
async function showCompletionMessageGSAP(overlay) {
  const loadingText = overlay.querySelector('.loading-text');
  
  // テキストを「抽選中...」に変更
  await gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0,
    scale: 0.8,
    onComplete: () => {
      loadingText.textContent = '抽選中...';
    }
  });
  
  await gsap.to(loadingText, {
    duration: 0.4,
    opacity: 1,
    scale: 1
  });
  
  await sleep(1000);
  
  // 完了メッセージに変更
  await gsap.to(loadingText, {
    duration: 0.3,
    opacity: 0
  });
  
  loadingText.textContent = '';
  
  const message = document.createElement('div');
  message.className = 'completion-message';
  message.textContent = '✨ 今週のカードが決まりました！';
  message.style.opacity = '0';
  message.style.transform = 'scale(0)';
  overlay.appendChild(message);
  
  await gsap.to(message, {
    duration: 0.8,
    opacity: 1,
    scale: 1,
    ease: "back.out(2)"
  });
  
  await sleep(1200);
}

// ==============================================
// 紙吹雪アニメーション（GSAP版）
// ==============================================

/**
 * 紙吹雪を発動
 * @param {Object} options - 紙吹雪のオプション
 */
function triggerConfetti(options = {}) {
  const {
    count = 30,
    colors = ['#9c27b0', '#e91e63'],
    duration = 2000,
    size = { min: 6, max: 10 },
    message = null
  } = options;
  
  // 特別メッセージがあれば表示
  if (message) {
    showSpecialMessage(message);
  }
  
  // 紙吹雪を生成
  for (let i = 0; i < count; i++) {
    createConfettiPiece(colors, duration, size);
  }
}

/**
 * 特別メッセージを表示
 */
function showSpecialMessage(message) {
  const messageEl = document.createElement('div');
  messageEl.className = 'confetti-message';
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0);
    font-size: 48px;
    font-weight: bold;
    color: #9c27b0;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
    z-index: 100000;
    opacity: 0;
    pointer-events: none;
  `;
  document.body.appendChild(messageEl);
  
  // GSAPでアニメーション
  gsap.to(messageEl, {
    duration: 0.8,
    opacity: 1,
    scale: 1,
    ease: "back.out(2)",
    onComplete: () => {
      gsap.to(messageEl, {
        duration: 0.5,
        opacity: 0,
        delay: 2,
        onComplete: () => {
          if (document.body.contains(messageEl)) {
            document.body.removeChild(messageEl);
          }
        }
      });
    }
  });
}

/**
 * 紙吹雪の1ピースを生成
 */
function createConfettiPiece(colors, duration, size) {
  const confetti = document.createElement('div');
  
  // ランダムな色を選択
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  // ランダムなサイズ
  const pieceSize = size.min + Math.random() * (size.max - size.min);
  
  // ランダムな形（丸 or 四角）
  const isCircle = Math.random() > 0.5;
  
  // ランダムな開始位置
  const startLeft = Math.random() * 100;
  
  confetti.style.cssText = `
    position: fixed;
    width: ${pieceSize}px;
    height: ${pieceSize}px;
    background-color: ${color};
    border-radius: ${isCircle ? '50%' : '0'};
    top: -20px;
    left: ${startLeft}%;
    z-index: 99999;
    pointer-events: none;
  `;
  
  document.body.appendChild(confetti);
  
  // ランダムな動き
  const randomX = (Math.random() - 0.5) * 300;
  const randomRotation = Math.random() * 720 - 360;
  const fallDuration = duration / 1000;
  
  // GSAPでアニメーション
  gsap.to(confetti, {
    duration: fallDuration,
    y: window.innerHeight + 50,
    x: randomX,
    rotation: randomRotation,
    opacity: 0,
    ease: "power1.in",
    onComplete: () => {
      if (document.body.contains(confetti)) {
        document.body.removeChild(confetti);
      }
    }
  });
}

// グローバルに公開
window.showCardDrawAnimation = showCardDrawAnimation;
window.triggerConfetti = triggerConfetti;