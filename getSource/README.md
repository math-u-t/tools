# View Source Viewer

入力された URL の HTML ソースを `view-source:` を用いて表示する、単機能の Web ページ。

[getSource](https://math-u-t.github.io/tools/getSource)でアクセスできます。

## 機能

* `http` / `https`URLを入力
* **Enter キー**または**ボタン**で実行
* 新しいタブで対象ページのソースを表示
* 不正なURLは拒否

## 仕様

### 入力

* 文字列 `s`

### 判定条件

* `s` が構文的に正しい URL
* プロトコルが `http:` または `https:`

### 振る舞い

* 条件を満たす場合

  ```
  view-source:<URL>
  ```

  を新規タブで開く
* 満たさない場合
  エラーを表示し、状態遷移なし

## 使用方法

1. 本リポジトリの HTML ファイルをブラウザで開く
2. 入力欄に URL を入力
   例:

   ```
   https://example.com
   ```
3. Enter キー、または「ソースを表示」ボタンを押す

## 動作環境

* Chromium 系ブラウザ（Chrome, Edge 等）
* Firefox

※ `view-source:` はブラウザ実装依存
※ Safari では動作しない場合あり

## 制限事項

* JavaScript から HTML ソースを直接取得することは不可
* クロスオリジン制約により、DOM 操作は行わない
* 検索機能・補完機能なし（仕様外）