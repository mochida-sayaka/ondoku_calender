// テーマ定義
const THEMES = {
  mystic: {
    name: 'ミスティック・タロット',
    emoji: '🔮',
    colors: {
      primary: '#8B5CF6',
      secondary: '#EC4899',
      accent: '#F59E0B',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      overlayBg: 'linear-gradient(135deg, rgba(123, 31, 162, 0.95), rgba(103, 58, 183, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#667eea',
      gradientEnd: '#764ba2',
      textDark: '#4a148c',
      textLight: '#7b1fa2'
    }
  },
  tropical: {
    name: 'トロピカル・サマー',
    emoji: '🌺',
    colors: {
      primary: '#EC4899',
      secondary: '#F97316',
      accent: '#14B8A6',
      background: 'linear-gradient(135deg, #FA8BFF 0%, #2BD2FF 52%, #2BFF88 90%)',
      overlayBg: 'linear-gradient(135deg, rgba(236, 72, 153, 0.95), rgba(249, 115, 22, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#FA8BFF',
      gradientEnd: '#2BFF88',
      textDark: '#C2185B',
      textLight: '#E91E63'
    }
  },
  snow: {
    name: 'ホリデー・スノー',
    emoji: '🎄',
    colors: {
      primary: '#DC2626',
      secondary: '#16A34A',
      accent: '#F59E0B',
      background: 'linear-gradient(135deg, #E3F2FD 0%, #BBDEFB 100%)',
      overlayBg: 'linear-gradient(135deg, rgba(220, 38, 38, 0.95), rgba(22, 163, 74, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#E3F2FD',
      gradientEnd: '#BBDEFB',
      textDark: '#B91C1C',
      textLight: '#15803D'
    }
  },
  sakura: {
    name: 'サクラ・スプリング',
    emoji: '🌸',
    colors: {
      primary: '#F9A8D4',
      secondary: '#FDE047',
      accent: '#86EFAC',
      background: 'linear-gradient(135deg, #FFE5EC 0%, #FFC2D1 100%)',
      overlayBg: 'linear-gradient(135deg, rgba(249, 168, 212, 0.95), rgba(253, 224, 71, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#FFE5EC',
      gradientEnd: '#FFC2D1',
      textDark: '#DB2777',
      textLight: '#EC4899'
    }
  },
  ocean: {
    name: 'オーシャン・ブリーズ',
    emoji: '🌊',
    colors: {
      primary: '#0EA5E9',
      secondary: '#06B6D4',
      accent: '#94A3B8',
      background: 'linear-gradient(135deg, #0F2027 0%, #203A43 50%, #2C5364 100%)',
      overlayBg: 'linear-gradient(135deg, rgba(14, 165, 233, 0.95), rgba(6, 182, 212, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#0F2027',
      gradientEnd: '#2C5364',
      textDark: '#0369A1',
      textLight: '#0891B2'
    }
  },
  midnight: {
    name: 'ミッドナイト・ドリーム',
    emoji: '🌙',
    colors: {
      primary: '#818CF8',
      secondary: '#A78BFA',
      accent: '#C084FC',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
      overlayBg: 'linear-gradient(135deg, rgba(129, 140, 248, 0.95), rgba(167, 139, 250, 0.95))',
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
    },
    canvasColors: {
      gradientStart: '#1e1b4b',
      gradientEnd: '#312e81',
      textDark: '#4338CA',
      textLight: '#6366F1'
    }
  }
};

// テーマを適用する関数
function applyTheme(themeId) {
  const theme = THEMES[themeId];
  if (!theme) return;
  
  const root = document.documentElement;
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-overlay-bg', theme.colors.overlayBg); 
  root.style.setProperty('--color-card-bg', theme.colors.cardBg);
  root.style.setProperty('--color-text', theme.colors.text);
  
  // テーマを保存
  localStorage.setItem('selectedTheme', themeId);
  
  // カレンダーが表示されていれば再描画
  if (window.renderCalendar && window.appState?.weeklyData) {
    window.renderCalendar(window.appState.weeklyData);
  }
  
  console.log(`✨ テーマ適用: ${theme.name}`);
}

// 保存されているテーマを読み込む
function loadSavedTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'mystic';
  applyTheme(savedTheme);
}

// ページ読み込み時にテーマを適用
document.addEventListener('DOMContentLoaded', loadSavedTheme);

// グローバルに公開
window.applyTheme = applyTheme;
window.THEMES = THEMES;

// 現在のテーマを取得
function getCurrentTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'mystic';
  return THEMES[savedTheme];
}

// 現在のテーマの絵文字を取得
function getThemeEmoji() {
  return getCurrentTheme().emoji;
}

// グローバルに公開
window.getCurrentTheme = getCurrentTheme;
window.getThemeEmoji = getThemeEmoji;