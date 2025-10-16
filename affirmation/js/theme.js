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