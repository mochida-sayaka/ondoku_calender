# 🔮 音読カレンダー - アファメーションver 開発引き継ぎ

**最終更新日**: 2025年10月15日  
**開発者**: mochida-sayaka  
**リポジトリ**: https://github.com/mochida-sayaka/ondoku_calender  
**公開URL**: https://mochida-sayaka.github.io/ondoku_calender/affirmation/

---

## 📋 目次
1. [プロジェクト概要](#プロジェクト概要)
2. [完成済み機能](#完成済み機能)
3. [技術スタック](#技術スタック)
4. [ファイル構成](#ファイル構成)
5. [重要な実装詳細](#重要な実装詳細)
6. [次のステップ](#次のステップ)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🎯 プロジェクト概要

英語学習用の音読練習アプリ。毎日異なるアファメーション（肯定的な言葉）をタロット式にランダム抽出し、ユーザーが音読・録音して練習できる。

### コンセプト
- **タロット式抽選**: 1,095種類の英文から重複なしでランダム抽出
- **気分に合わせた選択**: Gentle, Uplifting, Empowering, Balanced
- **レベル別学習**: 初級（英検5級/4級）、中級（英検3級）、上級（英検準2級/2級）
- **週単位の習慣化**: 1週間（7日間）を1サイクルとして管理

---

## ✅ 完成済み機能

### ✨ コア機能
- **タロット式ランダム抽選**: 1,095文から重複なく選出
- **週単位の設定**: 気分・難易度・文数（1〜3文/日）を選択
- **お手本音声再生**: Text-to-Speech API使用
- **録音＋再生確認**: MediaRecorder API
- **Firebase Storage 直接アップロード**: 音声ファイルを自動保存
- **Firestoreメタデータ保存**: ユーザー進捗・設定を記録

### 📊 統計・進捗管理
- **統計ダッシュボード**: リアルタイム進捗表示
- **連続記録日数**: Streak計算
- **週・累計完了率**: パーセンテージ表示
- **レベル別進捗**: 初級・中級・上級の達成率
- **週終了サマリー**: 1週間完了時に表示
- **レベルコンプリート機能**: 365文達成時の祝福演出

### 📤 シェア機能
- **X (Twitter) シェア**: テキスト投稿
- **Facebook シェア**: テキスト投稿
- **画像ダウンロード**: 統計情報付きレポート画像（Canvas生成）
- **テキストコピー**: クリップボードコピー

---

## 🛠️ 技術スタック

### フロントエンド
- **HTML5**: セマンティックHTML
- **CSS3**: Flexbox, Grid, カスタムプロパティ
- **JavaScript (ES6+)**: モジュール分割、async/await

### バックエンド / データベース
- **Firebase**:
  - Firestore: ユーザーデータ・進捗管理
  - Storage: 音声ファイル保存
  - Hosting: GitHub Pages経由でデプロイ

### API
- **Web Speech API**: Text-to-Speech（お手本音声）
- **MediaRecorder API**: 音声録音

### デプロイ
- **GitHub Pages**: 静的ホスティング
- **Git**: バージョン管理

---

## 📁 ファイル構成

```
ondoku_calender/
├── affirmation/
│   ├── css/
│   │   ├── base.css          # 基本スタイル・レイアウト
│   │   ├── screens.css       # 画面別スタイル
│   │   ├── stats.css         # 統計画面スタイル
│   │   └── animations.css    # アニメーション（未実装）
│   ├── js/
│   │   ├── firebase-config.js    # Firebase設定
│   │   ├── utils.js              # ユーティリティ関数
│   │   ├── firebase-service.js   # Firebase操作
│   │   ├── stats.js              # 統計計算
│   │   ├── calendar.js           # カレンダー表示
│   │   ├── affirmation.js        # アファメーション管理
│   │   └── main.js               # メインロジック・イベント処理
│   ├── index.html            # メインHTML
│   └── data/
│       └── affirmations.json # 1,095種類の英文データ（予定）
├── textbook/                 # 別プロジェクト（教科書版）
└── index.html                # ルートページ
```

---

## 🔑 重要な実装詳細

### 1. データ構造

#### weeklyCards（週間データ）
```javascript
{
  studentName: "田中太郎",
  mood: "gentle",
  level: "easy",
  sentencesPerDay: 2,
  weekStartDate: "2025-10-13",
  weekEndDate: "2025-10-19",
  weeklyCards: [
    {
      date: "2025-10-13",
      dayName: "月",
      affirmations: [
        { id: 123, text: "I am enough.", japanese: "私は十分な存在です", level: "easy", mood: "gentle" }
      ],
      completed: true,
      recordingUrl: "https://..."
    }
  ]
}
```

### 2. タロット式抽選アルゴリズム

```javascript
// 使用済みIDを記録して重複回避
usedIds = [1, 5, 23, ...]; // Firestoreに保存
availableIds = allIds.filter(id => !usedIds.includes(id));
selectedIds = shuffle(availableIds).slice(0, count);
```

### 3. Firebase Storage パス

```
recordings/
  └── {studentName}/
      └── {YYYY-MM-DD}/
          └── recording-{timestamp}.webm
```

### 4. JavaScript読み込み順序（重要！）

```html
<!-- 必ずこの順序で読み込む -->
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/firebase-service.js"></script>
<script src="js/stats.js"></script>
<script src="js/calendar.js"></script>
<script src="js/affirmation.js"></script>
<script src="js/main.js"></script>
```

**⚠️ 注意**: この順序を変えると動作しません！

---

## 🎯 次のステップ：アニメーション実装

### 実装予定の機能

#### 1. カード引く時の演出 🔮
- **カードめくりアニメーション**: 3D回転エフェクト
- **キラキラエフェクト**: パーティクルアニメーション
- **サウンドエフェクト**: カードをめくる音（オプション）

#### 2. ページ遷移アニメーション ✨
- **フェードイン/アウト**: 画面切り替え時
- **スライドアニメーション**: 左右からスライド
- **スムーズスクロール**: アンカーリンク

#### 3. 完了時のエフェクト 🎉
- **紙吹雪アニメーション**: Confetti.js または Canvas実装
- **バウンスエフェクト**: 完了ボタン
- **カウントアップアニメーション**: 統計数値

### 実装方針
- **CSS Animations**: 軽量でパフォーマンス良好
- **JavaScript Animations**: 複雑なインタラクション
- **Canvas**: パーティクルエフェクト

### 参考ライブラリ（検討中）
- `anime.js`: 軽量アニメーションライブラリ
- `canvas-confetti`: 紙吹雪エフェクト
- または、**ライブラリなしで純粋なCSS/JS実装**（推奨）

---

## 🐛 トラブルシューティング

### よくある問題と解決方法

#### 1. 無限ローディングが発生する

**原因**: JavaScriptの読み込み順序が間違っている

**解決策**:
```html
<!-- 正しい順序 -->
<script src="js/firebase-config.js"></script>
<script src="js/utils.js"></script>
<script src="js/firebase-service.js"></script>
<!-- ... 以下省略 -->
```

#### 2. SVGアイコンを追加したら動かなくなった

**原因**: HTML構造を変更してしまい、JavaScriptのセレクタが合わなくなった

**解決策**:
- **HTML構造は絶対に変えない**
- 絵文字をSVGに置き換える場合も、クラス名・ID・data属性は維持
- または、**絵文字のまま使う**（推奨）

#### 3. GitHubに反映されない

**原因**: ローカルファイルを保存していない、またはプッシュしていない

**解決策**:
```bash
# VS Codeで Cmd + S で保存
cd ~/Desktop/ondoku_calender
git add .
git commit -m "Update affirmation calendar"
git push
# 1-2分待ってから Cmd + Shift + R でリロード
```

#### 4. 音声録音ができない

**原因**: ブラウザがマイクアクセスを許可していない、またはHTTPS必須

**解決策**:
- GitHub Pagesは自動的にHTTPS
- ローカル開発時は `localhost` を使用
- ブラウザの設定でマイクアクセスを許可

---

## 📚 開発環境

### 必要なツール
- **VS Code**: エディタ
- **Git**: バージョン管理
- **Node.js**: 不要（静的サイト）
- **ブラウザ**: Chrome推奨（開発者ツール）

### ローカル開発
```bash
# シンプルHTTPサーバーを起動（Python）
cd ~/Desktop/ondoku_calender/affirmation
python3 -m http.server 8000

# ブラウザで開く
open http://localhost:8000
```

### デプロイ
```bash
# 変更をプッシュするだけで自動デプロイ
git add .
git commit -m "Your commit message"
git push
```

---

## 🔐 Firebase設定

### プロジェクト情報
- **プロジェクトID**: `english-calendar`
- **Storage Bucket**: `english-calendar.firebasestorage.app`

### セキュリティルール（現在）
- **Firestore**: 読み書き可能（全員）
- **Storage**: 読み書き可能（全員）

⚠️ **注意**: 本番環境では認証を追加推奨

---

## 📝 今後の改善案

### 短期（1-2週間）
- [ ] アニメーション実装
- [ ] 通知機能（ブラウザ通知）
- [ ] PWA化（オフライン対応）

### 中期（1ヶ月）
- [ ] ユーザー認証（Firebase Auth）
- [ ] 有料版への移行準備
- [ ] データバックアップ機能

### 長期（3ヶ月〜）
- [ ] AIチャットbot（Gemini API）
- [ ] 音声分析・発音評価
- [ ] 復習システム
- [ ] パーソナルフィードバック

---

## 🎓 学んだ教訓

### 開発中に得た重要な知見

1. **HTML構造は安易に変更しない**
   - JavaScriptが依存している場合、大規模な修正が必要になる
   - デザイン変更はCSS、機能変更はJS、構造はHTMLと分離する

2. **外部CDN（Lucide Icons等）は環境依存**
   - ローカルでは動いてもデプロイで動かないことがある
   - 絵文字やSVG埋め込みの方が確実

3. **JavaScriptの読み込み順序が超重要**
   - 依存関係を明確にする
   - `firebase-config.js` → `utils.js` → `main.js` の順

4. **Git管理は細かくコミット**
   - 動作確認後は必ずコミット
   - ロールバック時に便利

5. **ユーザーフィードバックは最優先**
   - 技術的にクールでも、使いにくければ意味がない
   - 絵文字 > SVGアイコン（親しみやすさ）

---

## 📞 連絡先・参考資料

### ドキュメント
- [Firebase Documentation](https://firebase.google.com/docs)
- [MDN Web Docs](https://developer.mozilla.org/)
- [GitHub Pages](https://pages.github.com/)

### リポジトリ
- **GitHub**: https://github.com/mochida-sayaka/ondoku_calender
- **Issues**: バグ報告・機能要望はここへ

---

## ✅ 引き継ぎチェックリスト

次の開発者（または未来の自分）へ：

- [ ] このドキュメントを全て読んだ
- [ ] ローカル環境でアプリが動作することを確認した
- [ ] Firebase設定が正しいことを確認した
- [ ] JavaScriptの読み込み順序を理解した
- [ ] Git操作の基本を理解した
- [ ] 次のステップ（アニメーション実装）を把握した

---

**最終更新**: 2025年10月15日  
**次回作業**: アニメーション実装（カード引く演出・ページ遷移・完了エフェクト）

🎉 ここまでお疲れ様でした！次の機能も一緒に頑張りましょう！