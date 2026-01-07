# 便利ツールポータル 🛠️

作業効率を最大化するための**ブラウザベースのウェブアプリケーション集**です。すべてのツールはクライアント側で処理されるため、プライベートで安全です。

## 🎯 ツール一覧

### 📄 [getSource](getSource/README.md)
指定したURLのHTMLソースをブラウザのソースビューで表示します。Web開発やページ分析に便利です。

### 🕐 [nowWatch](nowWatch/README.md)
高精度な時計、ストップウォッチ、タイマー、メモ機能を提供します。ミリ秒単位の精密な時間計測が可能です。

### 🔐 [hashMaster](hashMaster/README.md)
テキストのハッシュ化（SHA256・SHA512・Base64）、パスワード生成、ランダムテキスト生成を1つのタブ統合ツール。セキュリティと便利性を両立します。

### 🎙️ [audioChange](audioChange/README.md)
ブラウザで直接音声を録音・再生・管理できるツール。波形表示とリアルタイム音量計測機能付き。LocalStorageで複数の音声を保存可能。

### 📱 [webQR](webQR/README.md)
カメラ、画像ファイル、画面キャプチャからQRコードを読み取ります。読み取り履歴を自動保存し、URLは直接開くことが可能です。

### 🔐 [PGPbrowser](pgpbrowser/README.md)
ブラウザでPGP公開鍵暗号を実行。OpenPGP標準に準拠した鍵ペア生成、テキスト・ファイルの暗号化・復号化がすべてローカル処理。秘密鍵の安全性を保証します。

---

## 🌐 アクセス方法

すべてのツールは以下のURLでアクセス可能です：

- **メインサイト**: https://math-u-t.github.io/tools/
- **getSource**: https://math-u-t.github.io/tools/getSource/
- **nowWatch**: https://math-u-t.github.io/tools/nowWatch/
- **hashMaster**: https://math-u-t.github.io/tools/hashMaster/
- **audioChange**: https://math-u-t.github.io/tools/audioChange/
- **webQR**: https://math-u-t.github.io/tools/webQR/
- **PGPbrowser**: https://math-u-t.github.io/tools/pgpbrowser/

---

## ✨ 特徴

### 🔒 プライベートで安全
すべての処理はブラウザ内で実行されます。データはサーバーに送信されません。

### 🎨 統一されたデザイン
すべてのツールで統一された、モダンで使いやすいUIを採用しています。

### 📱 レスポンシブデザイン
スマートフォン、タブレット、デスクトップで快適に利用できます。

### ⚡ 高速で軽量
外部ライブラリに依存せず、ブラウザ標準APIのみを使用しています（QRコードスキャン用jsQRライブラリを除く）。

### 🔧 Web Crypto API対応
最新のWeb標準を使用した安全なハッシュ生成と乱数生成を実装しています。

---

## 🛠️ 技術スタック

- **HTML5**: セマンティックなマークアップ
- **CSS3**: CSS変数によるテーマシステム、フレキシブルレイアウト
- **JavaScript（ES6+）**: 最新のブラウザAPI利用
  - Web Crypto API
  - Clipboard API
  - Performance API
  - MediaRecorder API
  - Web Audio API
  - Canvas API
  - getUserMedia API
  - localStorage API

### 外部ライブラリ
- **jsQR**: QRコード読み取り・デコード
- **html2canvas**: スクリーンキャプチャ
- **openpgp.js**: PGP暗号化・復号化

---

## 📋 ブラウザ互換性

| ブラウザ | 対応状況 |
|---------|--------|
| Chrome/Edge | ✅ 完全対応 |
| Firefox | ✅ 完全対応 |
| Safari | ✅ 完全対応 |
| Opera | ✅ 完全対応 |

**備考**: MediaAPI系機能（audioChange、webQR）はHTTPS環境またはlocalhostで動作します。---

## 📄 ライセンス

MIT License

---

## 👨‍💻 開発者

[math-u-t](https://github.com/math-u-t)

---

## 🙏 サポート

問題や機能リクエストがある場合は、[GitHubのIssues](https://github.com/math-u-t/tools/issues)で報告してください。