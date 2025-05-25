# Google Sheets App

Google Sheetsと連携するNext.jsアプリケーションです。

## 機能

- Google Sheetsとの連携
- データの読み取りと書き込み
- モダンなUI/UXデザイン
- レスポンシブ対応

## 技術スタック

- Next.js 14
- TypeScript
- Tailwind CSS
- Google Sheets API
- NextAuth.js
- Radix UI

## 必要条件

- Node.js 18以上
- npm または yarn
- Google Cloud Platformのアカウントとプロジェクト
- Google Sheets APIの有効化

## セットアップ

1. リポジトリのクローン
```bash
git clone [repository-url]
cd google-sheets-app
```

2. 依存関係のインストール
```bash
npm install
# または
yarn install
```

3. 環境変数の設定
`.env.local`ファイルを作成し、以下の環境変数を設定してください：
```
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
```

4. 開発サーバーの起動
```bash
npm run dev
# または
yarn dev
```

## 使用方法

1. アプリケーションにアクセス（デフォルト: http://localhost:3000）
2. Googleアカウントでログイン
3. 連携したいGoogle Sheetsを選択
4. データの読み取りや書き込みを実行

## 開発

```bash
# 開発サーバーの起動
npm run dev

# ビルド
npm run build

# 本番環境での起動
npm run start

# リント
npm run lint
```

## ライセンス

このプロジェクトはMITライセンスの下で公開されています。
