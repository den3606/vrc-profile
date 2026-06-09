# vrc-profile

VRChat 風の静的プロフィールサイト。実績・アクセス端末・裏プロフィール・Steam 連携あり。

## 構成

| 部分 | 場所 |
|------|------|
| フロント | `src/`（Vite + TypeScript） |
| API | `worker/`（Cloudflare Workers） |
| 静的ファイル | `public/` |

本番は Cloudflare Workers に `dist/` と Worker をまとめてデプロイする。

## 必要なもの

- Node.js 20+
- Cloudflare アカウント（本番デプロイ時）

## セットアップ

```bash
npm install
```

## ローカルで試す

### フロントのみ

```bash
npm run dev
```

`http://localhost:5173` で開く。実績や UI の確認向け。

### 裏プロフィールの送信（API あり）

1. `.dev.vars.example` をコピーして `.dev.vars` を作る
2. `DISCORD_WEBHOOK_URL` に Discord Webhook URL を入れる
3. 2 つのターミナルで実行:

```bash
npm run dev:worker   # :8787
npm run dev          # :5173（/api を Worker にプロキシ）
```

## その他

```bash
npm test              # テスト
npm run build         # dist/ を生成
npm run preview       # ビルド結果の確認
npm run fetch-steam   # public/steam.json を更新
npm run deploy        # ビルド + Cloudflare へデプロイ
```

`fetch-steam` は「最近プレイしたゲーム」をプロフィール XML から、「プレイ時間の長いゲーム」12 件を [Steam Web API](https://steamcommunity.com/dev/apikey) の `GetOwnedGames` から取得する。後者には環境変数 `STEAM_API_KEY` が必要。GitHub Actions ではリポジトリの Secrets に `STEAM_API_KEY` を登録する（ゲーム詳細が公開のプロフィール向け）。

本番の Webhook URL は `npx wrangler secret put DISCORD_WEBHOOK_URL` で設定する。
