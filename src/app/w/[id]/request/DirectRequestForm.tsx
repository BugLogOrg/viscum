"use client";

import { useState } from "react";
import Link from "next/link";
import type { Work } from "@/data/dummy-works";

const MENTORS = [
  {
    handle: "メンターA",
    specialty: "動画",
    accepting: true,
    blurb: "Shorts／冒頭1秒の伝わり方",
  },
  {
    handle: "メンターJ",
    specialty: "アプリ",
    accepting: true,
    blurb: "初見3秒・空状態",
  },
  {
    handle: "観察I",
    specialty: "デザイン",
    accepting: false,
    blurb: "受付OFF（送れない見本）",
  },
] as const;

export function DirectRequestForm({ work }: { work: Work }) {
  const [mentor, setMentor] = useState<string>(MENTORS[0].handle);
  const [message, setMessage] = useState(
    `${work.title.slice(0, 40)}… を、あなただけに見てほしいです。見る範囲は説明どおりで大丈夫です。`,
  );
  const [closed, setClosed] = useState(false);

  const selected = MENTORS.find((m) => m.handle === mentor);
  const canSend = selected?.accepting && message.trim().length > 0;

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/50 px-3 py-3 text-[13px] text-viscum-ink">
        <p className="font-medium">内部向け（登録済みメンター）</p>
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          本番では<strong className="font-medium text-viscum-ink">登録メールが本命</strong>
          （休眠でも届く・呼び戻し）。あわせて
          <strong className="font-medium text-viscum-ink">この依頼だけの薄いDM</strong>
          が開き、ベルは補助。フォロー必須にはしない。
        </p>
      </div>

      <div className="rounded-lg border border-viscum-berry/25 bg-viscum-berry/5 px-3 py-3 text-[13px] text-viscum-ink">
        <p className="font-medium">外部向け（VISCUM未登録）</p>
        <p className="mt-1 text-[12px] leading-relaxed text-viscum-muted">
          DMやXに貼る着地はこちら。短いVISCUM紹介＋個人宛てのお願い。宣伝にもなる。
        </p>
        <p className="mt-2 break-all rounded border border-viscum-line bg-white/70 px-2 py-1.5 font-mono text-[11px] text-viscum-trunk">
          /dm/{work.id}?to=（相手の名前）
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Link
            href={`/dm/${work.id}?to=${encodeURIComponent("太郎")}`}
            className="text-[12px] font-medium text-viscum-brand underline"
          >
            DM用ページをプレビュー
          </Link>
          <button
            type="button"
            className="text-[12px] font-medium text-viscum-brand underline"
            onClick={() => {
              const url = `${window.location.origin}/dm/${work.id}?to=${encodeURIComponent("太郎")}`;
              void navigator.clipboard?.writeText(url);
              window.alert(
                `【デモ】コピーしました（例: to=太郎）\n${url}\n\n相手の名前は ?to= で差し替え。`,
              );
            }}
          >
            URLをコピー（デモ）
          </button>
        </div>
      </div>

    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSend) return;
        window.alert(
          [
            "【デモ】直依頼を送りました（実送信なし）",
            "",
            `宛先: ${mentor}`,
            closed ? "閲覧: クローズド（指名者のみ）" : "閲覧: 作品は公開のまま／依頼だけ個人宛て",
            "",
            "本番想定の到達:",
            "・登録メール（本命・呼び戻し）",
            "・この依頼単位の薄いDM",
            "・ベル／ダッシュボード未処理（補助）",
            "",
            "この依頼にコンペの話は含めていません。",
            "公開コンペは別導線です。",
          ].join("\n"),
        );
      }}
    >
      <div className="rounded-lg border border-viscum-line bg-viscum-paper-2/50 px-3 py-3 text-[13px] text-viscum-ink">
        <p className="font-medium">直依頼は「あなたに頼みたい」専用です</p>
        <p className="mt-1 text-viscum-muted leading-relaxed">
          公開コンペ（開催中・賞金）とは別の行為です。依頼文に「コンペもあります」は載せません——相手を予備に見せるからです。両方やるなら、コンペは別タイミング・別メッセージで。
        </p>
      </div>

      <div>
        <p className="text-[13px] text-viscum-muted">作品</p>
        <p className="mt-0.5 text-[14px] font-medium text-viscum-ink line-clamp-2">
          {work.title}
        </p>
        <Link
          href={`/w/${work.id}`}
          className="mt-1 inline-block text-[12px] text-viscum-brand underline"
        >
          作品ページを見る
        </Link>
      </div>

      <fieldset>
        <legend className="text-[13px] font-medium text-viscum-ink">
          指名するメンター
        </legend>
        <ul className="mt-2 space-y-2">
          {MENTORS.map((m) => (
            <li key={m.handle}>
              <label
                className={`flex cursor-pointer gap-3 rounded-lg border px-3 py-2.5 ${
                  mentor === m.handle
                    ? "border-viscum-brand bg-viscum-leaf-soft/40"
                    : "border-viscum-line bg-white/40"
                } ${!m.accepting ? "opacity-60" : ""}`}
              >
                <input
                  type="radio"
                  name="mentor"
                  className="mt-1"
                  checked={mentor === m.handle}
                  disabled={!m.accepting}
                  onChange={() => setMentor(m.handle)}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-viscum-ink">
                      {m.handle}
                    </span>
                    <span className="text-[11px] text-viscum-muted">
                      {m.specialty}
                    </span>
                    {!m.accepting && (
                      <span className="rounded bg-viscum-line/80 px-1.5 py-0.5 text-[10px] text-viscum-muted">
                        受付OFF
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block text-[12px] text-viscum-muted">
                    {m.blurb}
                  </span>
                </span>
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <div>
        <label
          htmlFor="request-message"
          className="text-[13px] font-medium text-viscum-ink"
        >
          一文（お願い）
        </label>
        <textarea
          id="request-message"
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1.5 w-full resize-y rounded-md border border-viscum-line bg-white/60 px-3 py-2 text-[14px] text-viscum-ink placeholder:text-viscum-muted"
          placeholder="見る範囲・なぜあなたに頼むかを短く"
        />
        <p className="mt-1 text-[11px] text-viscum-muted">
          コンペ・賞金・「他の人も募集中」は書かない（デモの礼儀ガイド）。
        </p>
      </div>

      <label className="flex items-start gap-2 text-[13px] text-viscum-ink">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={closed}
          onChange={(e) => setClosed(e.target.checked)}
        />
        <span>
          <span className="font-medium">クローズド（指名者のみ閲覧）</span>
          <span className="mt-0.5 block text-[12px] text-viscum-muted">
            創作の盗用不安など。非公開＝直依頼そのものではありません。依頼は常に個人宛てです。
          </span>
        </span>
      </label>

      <button
        type="submit"
        disabled={!canSend}
        className="w-full rounded-md bg-viscum-berry px-3 py-2.5 text-sm font-medium text-white disabled:opacity-50"
      >
        直依頼を送る（デモ・サイト内のメンター向け）
      </button>
    </form>
    </div>
  );
}
