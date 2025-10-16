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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
      cardBg: 'rgba(255, 255, 255, 0.95)',
      text: '#1F2937'
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
  root.style.setProperty('--color-card-bg', theme.colors.cardBg);
  root.style.setProperty('--color-text', theme.colors.text);
  
  // テーマを保存
  localStorage.setItem('selectedTheme', themeId);
  
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