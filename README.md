# Viscum app（コード正本）

> Vault ドキュメントは親フォルダ。**この `app/` だけが Git デプロイ対象**（`_運用` 等は入れない）。

- ブランド: Viscum / **`https://viscum.org`**（本番本丸・2026-08-29移行着手）
- スタック: **Vercel ＋ Next.js**（ADR-011）
- 要件: 親の `_運用/2026-08-18_【要件】UI要件定義_Viscum.md`

## ローカル

```bash
cd app
npm run dev
```

- トップ: http://localhost:3000  
- LP: http://localhost:3000/lp  
- 投稿: http://localhost:3000/new  

## DB（Neon）

```bash
# schema.ts を Neon に反映（本番・共有DB）
npm run db:push
```

- 正本: `src/db/schema.ts`（users／works／**comments**／**payments**）
- 履歴SQL: `drizzle/`（新規環境用スナップショット。既存Neonは push 運用）
- 集計ヘルパ: `src/db/payment-facts.ts`（層B・バッジ用。UI未配線）

## コメント画像（Vercel Blob）

- ブラウザが **Blob に直接**上げる（関数の約4.5MB制限を避ける）
- 環境変数: `BLOB_READ_WRITE_TOKEN`（Vercel Storage → Blob）
- 未設定時: 端末内の圧縮 JPEG（data URL）でデモ
- R2 との差: 同Vault `_knowledge/02_Architecture.md` の「画像ストレージ」節

- **本番本丸（2026-08-29〜）**: https://viscum.org （DNS Aレコード待ち・手順 `_運用/2026-08-29_【手順】viscum.org本番DNS.md`）
- **仮URL**: https://viscum.vercel.app （互換維持）
- **GitHub**: https://github.com/BugLogOrg/viscum （単独リポ。Vaultドキュメントは入れない）
- DNS: お名前.com `dnsv.jp` のまま（`mail.viscum.org` Resend維持）。ルートに A `76.76.21.21`

## いまあるもの

- [x] 骨格（Next 16 + Tailwind 4）
- [x] トンマナ CSS 変数
- [x] `/` **S01 高密度フィード**（ダミー12件・注目・開催中フィルタ）
- [x] `/w/[id]` **S02 詳細**（コメントはここだけ）
- [x] `/lp` 説明ページ（何の場か・シーダー／メンター・お金のやり取り）
- [x] `/new` **S04 投稿**（ダミー。コンペON・タグ・見てほしい・保存後の共有）
- [x] `/w/[id]/request`・`/dm/[id]` 直依頼（サイト内／外部DM）
- [x] `/u/[handle]` ポートフォリオ（支払い実績・フォロー）
- ~~`/demo` S00 登録不要デモ~~ → **削除**（2026-08-18。TOP自体が登録不要。ADR-011追記）
- [ ] 認証・DB・Stripe・実投稿
