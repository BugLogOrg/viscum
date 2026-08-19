# Viscum app（コード正本）

> Vault ドキュメントは親フォルダ。**この `app/` だけが Git デプロイ対象**（`_運用` 等は入れない）。

- ブランド: Viscum / `viscum.org`（DNS未接続）
- スタック: **Vercel ＋ Next.js**（ADR-011・仮決め）
- 要件: 親の `_運用/2026-08-18_【要件】UI要件定義_Viscum.md`

## ローカル

```bash
cd app
npm run dev
```

- トップ: http://localhost:3000  
- LP: http://localhost:3000/lp  
- 投稿: http://localhost:3000/new  

## Vercel

1. GitHub 等にこの `app/` リポジトリを push  
2. Vercel で Import → Framework Preset: Next.js  
3. 仮URLで確認してから `viscum.org` の DNS を接続  

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
