import type { Metadata } from "next";
import Link from "next/link";
import { LegalDocShell, LegalSection } from "@/components/LegalDocShell";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description:
    "VISCUM（ヴィスカム）のプライバシーポリシー。取得する情報、利用目的、保存・削除。",
};

const UPDATED = "2026年9月3日";

export default function PrivacyPage() {
  return (
    <LegalDocShell title="プライバシーポリシー" updated={UPDATED}>
      <p className="text-[13px] text-viscum-muted">
        VISCUM（ヴィスカム、以下「本サービス」）における個人情報等の取扱いです。デモ・検証段階の内容を含みます。
      </p>

      <LegalSection title="1. 取得する情報">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            アカウント情報（メールアドレス、英語ID、表示名、プロフィール文・画像など）
          </li>
          <li>認証・セッションに必要な情報（ログイン方式により異なります）</li>
          <li>
            投稿・コメント・直依頼・シードなど、サービス利用に伴い入力・送信される内容
          </li>
          <li>
            決済に関する記録（金額・完了事実など）。カード番号そのものは原則として決済事業者が扱い、本サービスは必要最小限の結果情報を受け取ります
          </li>
          <li>
            端末・ブラウザ情報、Cookie、アクセスログ（不正対策・品質改善のため）
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="2. 利用目的">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>本サービスの提供・維持・本人確認・不正防止</li>
          <li>直依頼などの通知（登録メールへの到達を含む）</li>
          <li>手数料・決済の処理と履歴の表示（支払い事実の可視化）</li>
          <li>お問い合わせ対応、重要なお知らせ</li>
          <li>サービス改善のための集計・分析（個人を特定しない形を優先）</li>
        </ul>
      </LegalSection>

      <LegalSection title="3. 第三者提供">
        <p>
          法令に基づく場合、またはサービス提供に必要な委託先（ホスティング、メール配信、決済事業者など）への預託を除き、本人の同意なく個人情報を第三者に販売・提供しません。
        </p>
        <p>
          公開プロフィール、公開シード、公開コメントなど、ユーザーが公開した情報は他の利用者から閲覧され得ます。
        </p>
      </LegalSection>

      <LegalSection title="4. 保存・安全管理">
        <p>
          取得した情報は、利用目的の達成に必要な期間保存し、漏えい等の防止に努めます。完全な安全を保証するものではありません。
        </p>
      </LegalSection>

      <LegalSection title="5. 開示・訂正・削除">
        <p>
          ご本人から、保有個人データの開示・訂正・削除等の求めがあった場合、法令に従い対応します。アカウント削除は設定画面から依頼できます。バックアップや法令上の保存義務により、直ちに完全消去できない場合があります。
        </p>
      </LegalSection>

      <LegalSection title="6. Cookie等">
        <p>
          ログイン維持や不正防止のため Cookie 等を使用することがあります。ブラウザ設定で拒否できますが、一部機能が使えなくなることがあります。
        </p>
      </LegalSection>

      <LegalSection title="7. 改定">
        <p>
          本ポリシーは必要に応じて改定します。重要な変更は本サービス上で告知します。
        </p>
      </LegalSection>

      <LegalSection title="8. お問い合わせ">
        <p>
          個人情報の取扱いに関するお問い合わせは、本サービス上の案内、または運営が別途示す連絡先までお願いします（公開準備に応じて連絡先を追記します）。
        </p>
      </LegalSection>

      <p className="text-[12px] text-viscum-muted">
        関連:{" "}
        <Link href="/terms" className="text-viscum-brand hover:underline">
          利用規約
        </Link>
        {" · "}
        <Link href="/faq" className="text-viscum-brand hover:underline">
          FAQ
        </Link>
      </p>
    </LegalDocShell>
  );
}
