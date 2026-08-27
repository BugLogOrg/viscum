import { scaffoldForPlan } from "@/data/seed-courses";

export type CompStatus = "none" | "open" | "pay_soon" | "closed";

/** フィード／詳細デモ用。ADR-031/034 の4コース＋直依頼は別 */
export type DemoSeedPlan =
  | "free_comment"
  | "first_impression"
  | "brush_up"
  | "public_boost";

export type Comment = {
  id: string;
  author: string;
  /** 投稿時のアカウント名（任意。英語IDと別） */
  accountName?: string;
  /** 一覧行に出す件名・見出し（GmailのSubject相当） */
  subject: string;
  body: string;
  hoursAgo: number;
  /** 指摘スクショ等（Blob URL またはデモ用URL） */
  imageUrls?: string[];
  adopted?: boolean;
  /** 採用後にチップ／賞金を支払済み */
  tipped?: boolean;
  tipYen?: number;
  /** コンペ締切後に書かれたコメント（賞金対象外の明示用） */
  afterClose?: boolean;
};

export type Work = {
  id: string;
  title: string;
  tagline: string;
  seeder: string;
  /** シーダーのアカウント名（英語IDと別。無いときは handle から補完） */
  seederAccountName?: string;
  tags: string[];
  status: CompStatus;
  /** デモ上のコース（価格表と揃える） */
  plan?: DemoSeedPlan;
  prizeYen?: number;
  hoursAgo: number;
  /** 締切まであと何時間（なし／終了は undefined） */
  closesInHours?: number;
  featured?: boolean;
  description: string;
  prompts?: string[];
  externalUrl: string;
  /** サムネ用の葉〜実の色キー */
  thumbTone: "leaf" | "moss" | "berry" | "bark" | "trunk";
  /** 任意サムネ（data URL や https）。無いとき色面 */
  thumbUrl?: string;
  comments: Comment[];
  paymentsDone?: number;
  /** フィード人気表示用（他ユーザ含めたデモ集計。未指定時は合成） */
  sukiCount?: number;
  bookmarkCount?: number;
};

export function planBadgeLabel(plan?: DemoSeedPlan): string | undefined {
  if (plan === "free_comment") return "無料コメント";
  if (plan === "first_impression") return "初見レビュー";
  if (plan === "brush_up") return "改善提案";
  if (plan === "public_boost") return "公開ブースト";
  return undefined;
}

/** スキ／気になるの他ユーザ込み件数（デモ）。自分の打刻はUI側で+1する */
export function getWorkReactionCounts(work: Work): {
  suki: number;
  bookmark: number;
} {
  if (work.sukiCount != null || work.bookmarkCount != null) {
    return {
      suki: work.sukiCount ?? 0,
      bookmark: work.bookmarkCount ?? 0,
    };
  }
  const base = work.comments.length * 4 + (work.featured ? 18 : 0);
  const fresh = Math.max(0, 24 - Math.min(work.hoursAgo, 24));
  const prizeBoost = work.prizeYen ? Math.floor(work.prizeYen / 5000) : 0;
  const suki = base + Math.floor(fresh / 2) + prizeBoost;
  const bookmark =
    Math.max(0, Math.floor(suki * 0.45) + (work.status === "open" ? 2 : 0));
  return { suki, bookmark };
}

export function formatCount(n: number): string {
  if (n >= 10000) return `${(n / 10000).toFixed(1).replace(/\.0$/, "")}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

const DUMMY_WORKS_RAW: Work[] = [
  {
    id: "viscum-self",
    title: "個人が作ったアプリや動画を速報棚に載せて、少額のコメントコンペを広告費としてばらまけるか——Viscum（ヤドリギ候補）自体の初見レビュー募集。開催中バッジと金額、払う顔は伝わる？稼ぐ副業っぽく見えない？名前・色・初動の迷いを一言ください。厳しめで短くて大丈夫です。",
    tagline: "少額コンペ＝少額広告の顔は伝わるか",
    seeder: "tori",
    tags: ["アプリ", "告知"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 2,
    closesInHours: 46,
    featured: true,
    description:
      "個人制作物の速報棚＋任意コンペの装置です。初見で迷いやすいところを、聞くこと（足場）に沿って一言ください。",
    externalUrl: "https://viscum.org",
    thumbUrl: "/thumbs/viscum-self.jpg",
    thumbTone: "leaf",
    paymentsDone: 0,
    sukiCount: 42,
    bookmarkCount: 19,
    comments: [
      {
        id: "c1",
        author: "メンターA",
        subject: "広告費の出口に見える。稼ぐ顔だけ避けたい",
        body: "1. 何の作品／サービスだと思いましたか？\n個人の作品を棚に載せて、少額コンペを広告費として撒く場だと思います。\n\n2. どんな人向けだと思いましたか？\n自分のアプリや動画を出したばかりで、知人以外の反応が欲しい作り手。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。開催中バッジと金額が一目で『払う側の祭り』に見えるのが強いです。\n\n4. 一番気になったところはどこですか？\nLPが稼ぐ／ポイ活寄りだと仕事板に寄るので、シーダー主語のまま押し切りたいです。",
        hoursAgo: 1,
        adopted: true,
      },
      {
        id: "c2",
        author: "レビュアーB",
        subject: "棚の速報装置。コメントは詳細で展開が正解",
        body: "1. 何の作品／サービスだと思いましたか？\n制作物の速報棚＋任意コンペの装置。\n\n2. どんな人向けだと思いましたか？\nフィードを流し見して刺さった作品だけ深掘りしたいメンター寄り。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。件名だけ見せて本文をGmail型で展開できると長文でも読める。\n\n4. 一番気になったところはどこですか？\n一覧にコメント本文を出すと縦に死ぬので、サムネ＋見出しに寄せた判断は良いです。",
        hoursAgo: 3,
      },
      {
        id: "c3",
        author: "作り手C",
        subject: "¥5,000は本気シグナル。名前はまだ揺れる",
        body: "1. 何の作品／サービスだと思いましたか？\n『払うから見て』を他人に頼みやすくする、少額広告の出口。\n\n2. どんな人向けだと思いましたか？\n知人にタダで頼むのが気まずい個人開発者。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。無料帯より¥5,000の方が本気度が伝わる。\n\n4. 一番気になったところはどこですか？\nViscum／ヤドリギの名前が初見で一瞬揺れる。色（緑と実）は温かくて良いです。",
        hoursAgo: 5,
      },
      {
        id: "c4",
        author: "観察D",
        subject: "温かい場。紫テックにしない判断が効いている",
        body: "1. 何の作品／サービスだと思いましたか？\n個人制作の祭り／速報の場。\n\n2. どんな人向けだと思いましたか？\nテックっぽい副業アプリより、浜の温度で作品を出したい人。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。緑と実の赤橙、紙クリームが思想と揃っている。\n\n4. 一番気になったところはどこですか？\nサムネが色面仮置きでもトンマナが通っている点は良い。ダークネオンに寄せないでほしい。",
        hoursAgo: 8,
      },
    ],
  },
  {
    id: "note-clip",
    title: "朝起きてすぐ三行だけ書けばいいメモアプリのβです。書くハードルを下げたいのに起動直後が空白だと迷うので、オンボーディングと通知のうざさ、ウィジェットの初見を見てほしいレビュー募集。何のアプリか3秒で分かるか、優しすぎ／指図がましいの境界も教えてください。",
    tagline: "書くハードルを下げたいβ",
    seeder: "ayu",
    tags: ["アプリ"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 4,
    closesInHours: 20,
    description: "起床後3行だけ書くメモ。通知とウィジェットの初見を見てほしい。",
    externalUrl: "https://example.com/memo",
    thumbUrl: "/thumbs/note-clip.jpg",
    thumbTone: "moss",
    comments: [
      {
        id: "c1",
        author: "早起きE",
        subject: "メモアプリに見える。最初の空白が気になる",
        body: "1. 何の作品／サービスだと思いましたか？\n朝起きてすぐ三行書くメモアプリ。\n\n2. どんな人向けだと思いましたか？\n日記は重いが、短い一行なら続けたい人。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。『書け』より『今日の一行目』の方が優しそう。\n\n4. 一番気になったところはどこですか？\n起動直後が真っ白で、何をするか3秒迷いました。プレースホルダか昨日の続きが見えると安心します。",
        hoursAgo: 2,
      },
    ],
  },
  {
    id: "promo-15s",
    title: "宅配ボックスIoTの15秒プロモ（YouTube Shorts想定）。冒頭1秒で何の製品か分かるか、音なしでも伝わるかだけ見てほしいです。フル尺は不要で、最初の15秒の掴みとテロップの密度にコメントください。広告っぽすぎ／地味すぎ、ブランド名の出し方の指摘も大歓迎です。",
    tagline: "冒頭1秒で何の製品か分かる？",
    seeder: "ken",
    tags: ["動画"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 6,
    closesInHours: 8,
    description: "YouTube Shorts用。見る範囲は冒頭15秒だけでOK。聞くこと（足場）に沿って短く。",
    externalUrl: "https://example.com/video",
    thumbUrl: "/thumbs/promo-15s.jpg",
    thumbTone: "berry",
    comments: [
      {
        id: "c1",
        author: "動画見F",
        subject: "宅配ボックス。音なしだと一瞬迷う",
        body: "1. 何の作品／サービスだと思いましたか？\n宅配ボックス（IoT）の15秒プロモ。\n\n2. どんな人向けだと思いましたか？\n共働きで荷物の受け取りに困っている人。\n\n3. 興味を持ちましたか？理由も一言\n興味あり。荷物がボックスに落ちるカットは分かりやすい。\n\n4. 一番気になったところはどこですか？\n音なしだと冒頭1秒で製品名が弱く、テロップを半拍早く出したいです。",
        hoursAgo: 1,
      },
    ],
  },
  {
    id: "novel-open",
    title: "短編『団地の屋上』のあらすじと冒頭800字だけ公開します。続きが読みたくなる温度感か、一人目の印象は残るか。全文ではなく入口だけのレビュー募集です。タイトル案や刺さった一文、あらすじの長さの負荷感も大歓迎。小説タグのメンター向けコンペなので、厳しめでお願いします。",
    tagline: "あらすじ＋冒頭800字の温度感",
    seeder: "sana",
    tags: ["小説", "短編", "冒頭"],
    status: "open",
    plan: "brush_up",
    prizeYen: 10000,
    hoursAgo: 9,
    closesInHours: 72,
    description: "全文ではなく冒頭のみ。改善提案の聞くこと（足場）に沿って。",
    externalUrl: "https://example.com/novel",
    thumbUrl: "/thumbs/novel-open.jpg",
    thumbTone: "bark",
    comments: [
      {
        id: "c1",
        author: "読者F",
        subject: "屋上の匂いは残る。一人目をもう半歩早く",
        body: "1. 良かったところは？\n『コンクリートが昼の熱を吐いている』あたりで続きが欲しくなりました。あらすじの長さもちょうどよい負荷です。\n\n2. 違和感があったところは？（理由つき）\n一人目の声が入るのが遅い。誰の物語か掴むまで半拍迷います。\n\n3. 分かりにくかったところは？\n屋上に上がる動機がまだ薄い。鍵／風向きのモチーフがあると入口が締まります。\n\n4. 自分ならどう直しますか？（代案）\n冒頭2段落目までに一人目の短い独白を入れる。タイトル案は『屋上の鍵』『団地の風向き』。",
        hoursAgo: 4,
        adopted: true,
      },
    ],
  },
  {
    id: "lp-saas",
    title: "B2B請求書SaaSのランディング初見チェックです。誰向けのサービスか3秒で分かるか、ヒーロー文とCTAの温度は営業っぽすぎないか。決済UIはまだ準備中なので、見た目とコピー中心でお願いします。ターゲット誤解、専門用語の壁、次に押すべきボタンの位置を指摘してほしいです。",
    tagline: "誰向けか3秒で分かるか",
    seeder: "rio",
    tags: ["アプリ", "LP"],
    status: "pay_soon",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 12,
    closesInHours: 30,
    description: "決済UIはまだ準備中。コメントは歓迎、チップ確定は後から。",
    externalUrl: "https://example.com/lp",
    thumbTone: "trunk",
    comments: [],
  },
  {
    id: "idle-game",
    title: "放置系『苔を育てる』を無料公開しています。コンペなしで感想とお礼だけで回すテストです。最初の成長が遅すぎて離脱しないか、待つ楽しさは伝わるか。ゲームとして成立しているかのラフなフィードバックをください。報酬の粒度やチュートリアル後の空白感など、具体があると助かります。",
    tagline: "無料公開・感想だけでも",
    seeder: "moss",
    tags: ["ゲーム"],
    status: "none",
    plan: "free_comment",
    hoursAgo: 14,
    description: "コンペなし。お礼と採用だけで回すテスト。",
    externalUrl: "https://example.com/moss",
    thumbTone: "moss",
    comments: [
      {
        id: "c1",
        author: "プレイヤーG",
        subject: "最初の成長が遅すぎて離脱しそう",
        body: "チュートリアル後、次の変化まで待ち時間が長く、『待つ楽しさ』が言語化されていませんでした。最初の5分で小さな花が咲くなど、報酬の粒度を細かくすると放置ゲーの快感に乗れると思います。コンペなしでもお礼だけもらえる空気は良いです。",
        hoursAgo: 6,
      },
    ],
  },
  {
    id: "chrome-ext",
    title: "タブをヤドリギみたいに束ねるChrome拡張の初動レビュー募集です。インストールから最初のグループ作成まで見てほしい。権限説明は怖くないか、グループ名の付け方UIは迷わないか。ストア文面の印象、アイコンの識別性、やり直しのしやすさも一言もらえると助かります。短文歓迎です。",
    tagline: "グループ名の付け方レビュー",
    seeder: "tab",
    tags: ["アプリ"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 18,
    closesInHours: 54,
    description: "Chrome拡張。インストール〜最初のグループ作成まで。",
    externalUrl: "https://example.com/ext",
    thumbUrl: "/thumbs/chrome-ext.jpg",
    thumbTone: "leaf",
    comments: [],
  },
  {
    id: "podcast-cover",
    title: "ポッドキャスト封面の大喜利コンペです。真面目な添削より、タイトル案・一言ツッコミ・サムネの第一印象をください。音声番組の顔としてクリックしたくなるか。短くて尖った案ほど採用しやすいです。初見レビュー帯の軽量祭りなので気軽に。色・フォント・余白の違和感の指摘も歓迎しています。",
    tagline: "タイトル案を一言で",
    seeder: "wave",
    tags: ["音声", "大喜利"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 22,
    closesInHours: 12,
    description: "真面目な添削よりタイトル・一言ツッコミ歓迎。",
    externalUrl: "https://example.com/pod",
    thumbTone: "berry",
    comments: [],
  },
  {
    id: "closed-one",
    title: "先週終了したUI壁打ちコンペのアーカイブ見本です。採用→支払い完了まで終わったあとの見え方チェック用。新規は受け付けない想定なので、閲覧時に迷わないかだけ見てください。終わった祭りの棚残り方、採用バッジと支払い済みの見つけやすさ、メンターの出金導線の有無も見てほしいです。",
    tagline: "採用済み・支払い完了アーカイブ",
    seeder: "neo",
    tags: ["アプリ"],
    status: "closed",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 48,
    paymentsDone: 1,
    description:
      "終了＋支払い完了の見本。採用コメントにチップ支払い済みと、メンター向け「受け取る」導線（デモ）が付きます。",
    externalUrl: "https://example.com/old",
    thumbTone: "trunk",
    comments: [
      {
        id: "c1",
        author: "メンターH",
        subject: "ナビが一段深い。設定をトップへ",
        body: "メイン導線から設定までタップが一つ多く、親指ゾーンの外に重要項目がありました。\n\n![ナビが深い例](https://picsum.photos/seed/viscum-nav/960/540)\n\n終了コンペのアーカイブとして残すなら、『採用済み』が件名横にあるとシーダーの学びログにもなります。\n\n![親指ゾーン](https://picsum.photos/seed/viscum-thumb/960/540)\n\n長文レビューも件名だけで流し読みできると助かります。",
        hoursAgo: 40,
        adopted: true,
        tipped: true,
        tipYen: 5000,
        imageUrls: [
          "https://picsum.photos/seed/viscum-nav/960/540",
          "https://picsum.photos/seed/viscum-thumb/960/540",
        ],
      },
      {
        id: "c2",
        author: "観察I",
        subject: "終了ラベルと支払い済みが並ぶと安心",
        body: "決済準備中で止まらず、支払い完了まで見えるとメンターも次に書きやすいです。スコアではなく件数の事実で十分だと思います。",
        hoursAgo: 36,
      },
    ],
  },
  {
    id: "pay-after-adopt",
    title: "採用した直後・Checkout前の見本です。決済準備中を越えて、シーダーが『採用して支払う』を押す直前の画面。メンターにはまだ出金リンクが出ない想定。採用マークは付いているがチップ未払い、という中間状態が分かるか確認してください。文言が怖くないか、金額の再確認が足りるかも見てほしいです。",
    tagline: "採用直後・支払い前",
    seeder: "tori",
    tags: ["アプリ", "決済"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 5,
    closesInHours: 28,
    paymentsDone: 0,
    featured: true,
    description:
      "決済準備中の先＝採用時支払いの直前。コメントは採用済みだが、まだ Checkout していない状態のデモです。",
    externalUrl: "https://example.com/pay-after",
    thumbTone: "berry",
    comments: [
      {
        id: "c1",
        author: "メンターJ",
        subject: "初見3秒で何のアプリか分かる。次は空状態",
        body: "ヒーローは伝わります。起動直後の空白だけが不安なので、昨日の続きかプレースホルダがあると良いです。採用してもらえたら嬉しいですが、支払いはシーダー判断でOKです。",
        hoursAgo: 3,
        adopted: true,
      },
    ],
  },
  {
    id: "figma-proto",
    title: "予約フローのFigmaクリックプロトです。スマホ親指ゾーンで最初の3タップまで見てほしい。戻る位置、次へ、日付選択の迷いをコメントください。デザインの美しさより到達のしやすさ優先です。指が届かない、一段深い、ラベルが曖昧——この手の指摘が特に欲しいです。短文で大丈夫です。",
    tagline: "スマホ親指ゾーンの迷い",
    seeder: "yuki",
    tags: ["デザイン"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 3,
    closesInHours: 36,
    description: "Figmaプロト。見る範囲は最初の3タップまで。",
    externalUrl: "https://example.com/figma",
    thumbTone: "bark",
    comments: [],
  },
  {
    id: "cli-tool",
    title: "READMEとgifだけ見てもらうCLIツールのドキュメント初見レビューです。インストール前の期待値は合うか、何をするコマンドか怖そうに見えないか。実際のinstallは不要です。専門用語の壁とデモ動画の長さ、コピーコマンドの安心感も見てほしい。初心者目線のコメント大歓迎です。短くてOK。",
    tagline: "インストール前の期待値",
    seeder: "dev",
    tags: ["ツール"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 7,
    closesInHours: 96,
    description: "リポジトリのREADMEとgifだけ。実際のinstallは不要。",
    externalUrl: "https://example.com/cli",
    thumbTone: "leaf",
    comments: [],
  },
  {
    id: "recipe-site",
    title: "一人暮らし向け5分レシピ棚の公開（コンペなし）です。検索せずにTonightの一皿が出るか、写真と手順の密度はスマホで辛くないか。感想コメント歓迎。料理サイトでありがちな情報過多／不足のどちらに寄っているか、材料の単位の分かりやすさ、献立の決断コストも教えてください。",
    tagline: "検索せずに Tonight が出るか",
    seeder: "nabe",
    tags: ["Web"],
    status: "none",
    plan: "free_comment",
    hoursAgo: 11,
    description: "コンペなしの公開。感想歓迎。",
    externalUrl: "https://example.com/recipe",
    thumbUrl: "/thumbs/recipe-site.jpg",
    thumbTone: "moss",
    comments: [],
  },
  {
    id: "pitch-deck",
    title: "1枚ピッチPDFの視線誘導レビューです。最初の3秒で何のサービスか伝わるか、次に何をしてほしいかが分かるか。投資家向けというより個人開発の仲間向けトーンです。誤解ポイントと目線の止まる場所を件名に書いてくれると嬉しいです。文字量の多さ、余白の足りなさも見てほしいです。",
    tagline: "最初の3秒で何が伝わるか",
    seeder: "kai",
    tags: ["デザイン"],
    status: "open",
    plan: "first_impression",
    prizeYen: 5000,
    hoursAgo: 1,
    closesInHours: 18,
    description: "PDF1枚。初見の視線と誤解ポイントをください。",
    externalUrl: "https://example.com/pitch",
    thumbTone: "berry",
    comments: [],
  },
  {
    id: "podcast-op",
    title: "ポッドキャストOP30秒の掴みチェックです。スキップされない導入になっているか、トーンは親しすぎ／堅すぎないか。音声のみ・映像なし前提でお願いします。冒頭の自己紹介の長さと本題への入り方にコメントください。BGMの大きさ、間の取り方の違和感も短文で十分です。厳しめで大丈夫。",
    tagline: "スキップされない掴み",
    seeder: "rim",
    tags: ["動画"],
    status: "open",
    plan: "brush_up",
    prizeYen: 10000,
    hoursAgo: 5,
    closesInHours: 40,
    description: "音声のみ。導入の長さとトーン。",
    externalUrl: "https://example.com/pod",
    thumbTone: "trunk",
    comments: [],
  },
  {
    id: "chrome-ext-store",
    title: "タブ整理Chrome拡張の公開ブーストです。Chromeウェブストア（またはX）へ正直な反応・投稿を残したあと、投稿URLを報告してください。権限ダイアログが怖く見えないか、何が片付く拡張か分かるか。褒賞は全員払いではなく、報告を見てシーダーが選びます。星の指定・やらせは不可。実利用したうえで書いてください。",
    tagline: "ストア／SNSへ正直な反応→報告",
    seeder: "ext",
    tags: ["ツール", "アプリ"],
    status: "open",
    plan: "public_boost",
    prizeYen: 30000,
    hoursAgo: 9,
    closesInHours: 72,
    featured: true,
    description:
      "公開ブースト見本。外に書いてから報告。褒賞はシーダーが選ぶ（¥30,000予算）。",
    externalUrl: "https://example.com/ext",
    thumbUrl: "/thumbs/chrome-ext-store.jpg",
    thumbTone: "leaf",
    sukiCount: 28,
    bookmarkCount: 15,
    comments: [
      {
        id: "c1",
        author: "メンターK",
        subject: "ストア短評を投稿して報告（実利用済み）",
        body: "1. 指定した公開場所へ正直な反応・投稿を残す\nChromeウェブストアに『タブが束ねられて視界が楽』と短評を投稿しました。\n\n2. 実利用したうえで書く\nスクショ3枚を見てからインストールし、実際にタブを束ねて使いました。触っていない評価ではありません。\n\n3. シーダー指定の観点に触れる\n権限ダイアログは許容範囲。何が片付く拡張かはアイコンと一文でだいたい伝わります。\n\n4. やらせ・星の売買保証は不可／開示\n星の指定はしていません。個人利用の正直な短評です。\n\n5. 記入後に投稿URL等を報告\n報告URL（デモ仮置き）→ https://example.com/review-demo",
        hoursAgo: 2,
      },
    ],
  },
  {
    id: "short-story",
    title: "掌編『バス停の傘』約2000字のレビュー募集です。結末の余韻の切れ方だけ重点的に見てほしい。途中の描写より、最後の一文が残るか。タイトルと結末の対応も気になっています。ネタバレを件名に書いても大丈夫です。長さの負荷感と、読み直ししたいかどうかも一言ください。小説メンター向け・改善提案帯。",
    tagline: "余韻の切れ方",
    seeder: "umi",
    tags: ["小説"],
    status: "open",
    plan: "brush_up",
    prizeYen: 10000,
    hoursAgo: 14,
    closesInHours: 60,
    description: "2000字。結末の一言だけ見てほしい。改善提案の聞くことに沿って。",
    externalUrl: "https://example.com/story2",
    thumbTone: "moss",
    comments: [
      {
        id: "c1",
        author: "読者L",
        subject: "最後の一文は残る。タイトルとの対応をもう一歩",
        body: "1. 良かったところは？\n結末の一文で余韻が切れず、読み直したくなりました。長さの負荷もちょうどよいです。\n\n2. 違和感があったところは？（理由つき）\nタイトル『バス停の傘』と結末のモチーフがまだ薄い。傘が出るのが遅い。\n\n3. 分かりにくかったところは？\n中盤の会話が誰視点か一瞬迷いました。\n\n4. 自分ならどう直しますか？（代案）\n冒頭か中盤で傘を一度見せ、結末で回収する。件名にネタバレ可なら『傘を置いていく』案も候補。",
        hoursAgo: 6,
      },
    ],
  },
  {
    id: "landing-ab",
    title: "LPヒーロー文案A/Bのどちらが「払う気」になるか選んで、理由を件名に書いてください。個人プロダクトの少額コンペ誘導用です。煽りすぎず、でも弱いと消える——その境界のレビューが欲しいです。スクショ2案を見比べて一票を。禁止語感や企業LPっぽさの指摘も大歓迎しています。",
    tagline: "どっちが『払う気』になるか",
    seeder: "abo",
    tags: ["Web", "告知"],
    status: "open",
    plan: "brush_up",
    prizeYen: 10000,
    hoursAgo: 2,
    closesInHours: 14,
    description: "2案のスクショ。改善提案の聞くことに沿って、どちらを選ぶかも本文で。",
    externalUrl: "https://example.com/lp",
    thumbTone: "bark",
    comments: [
      {
        id: "c1",
        author: "コピーM",
        subject: "Bを選ぶ。煽りが薄くて払う気が残る",
        body: "1. 良かったところは？\nB案は『払うから見て』が穏やかで、個人プロダクトの温度に合う。\n\n2. 違和感があったところは？（理由つき）\nA案の『今すぐ』が企業LPっぽく、本気シグナルより催促に見える。\n\n3. 分かりにくかったところは？\nA/Bの差分がヒーロー文だけで、CTAボタン色まで揃っていると迷う。\n\n4. 自分ならどう直しますか？（代案）\nBをベースに、金額を副文で明示。件名に『B・払う気』と書く運用も良いです。",
        hoursAgo: 1,
      },
    ],
  },
  {
    id: "icon-set",
    title: "アプリアイコン案4種の識別チェック（コンペなし）です。小さいサイズでも何のアプリか分かるか、ヤドリギっぽさと汎用アイコンの間でどれが強いか。好き嫌いベースで大丈夫です。ホーム画面に並んだ想像での一言コメント歓迎。似て見える組や、潰れて読めない案があれば教えてください。",
    tagline: "小さいサイズでも識別できるか",
    seeder: "ico",
    tags: ["デザイン"],
    status: "none",
    plan: "free_comment",
    hoursAgo: 20,
    description: "コンペなし。好き嫌いコメント歓迎。",
    externalUrl: "https://example.com/icon",
    thumbTone: "berry",
    comments: [],
  },
];

/** コース定義の「聞くこと／募集の目安」をデモ作品の prompts に揃える */
export const DUMMY_WORKS: Work[] = DUMMY_WORKS_RAW.map((w) => {
  let next = w;
  // 長文タイトル→短い見出し＋説明へ寄せる（ADR-045）
  if (next.title.trim().length > 100) {
    const long = next.title.trim();
    const short =
      next.tagline.trim().length > 0 && next.tagline.trim().length <= 100
        ? next.tagline.trim()
        : `${long.slice(0, 99)}…`;
    const desc = next.description.trim();
    next = {
      ...next,
      title: short,
      tagline: short,
      description: desc.startsWith(long) ? desc : `${long}\n\n${desc}`.trim(),
    };
  }
  if (!next.plan) return next;
  const scaffold = scaffoldForPlan(next.plan);
  if (!scaffold) return { ...next, prompts: undefined };
  return { ...next, prompts: scaffold.lines };
});

export function getWork(id: string): Work | undefined {
  return DUMMY_WORKS.find((w) => w.id === id);
}

export function getWorksBySeeder(seeder: string): Work[] {
  const key = seeder.toLowerCase();
  return DUMMY_WORKS.filter((w) => w.seeder.toLowerCase() === key);
}

/** シーダーの支払い実績（事実。スコアではない） */
export type SeederPayFacts = {
  handle: string;
  /** 累計支払額（円） */
  paidYenTotal: number;
  /** 支払い完了件数 */
  paymentsCount: number;
};

/**
 * デモ用の支払い実績。本番は決済ログ集計。
 * キーは小文字 handle。
 */
const DUMMY_SEEDER_PAY: Record<
  string,
  Omit<SeederPayFacts, "handle">
> = {
  tori: { paidYenTotal: 48000, paymentsCount: 12 },
  ayu: { paidYenTotal: 15000, paymentsCount: 3 },
  ken: { paidYenTotal: 10000, paymentsCount: 2 },
  sana: { paidYenTotal: 10000, paymentsCount: 1 },
  rio: { paidYenTotal: 0, paymentsCount: 0 },
  moss: { paidYenTotal: 5000, paymentsCount: 1 },
  tab: { paidYenTotal: 15000, paymentsCount: 3 },
  wave: { paidYenTotal: 5000, paymentsCount: 1 },
  neo: { paidYenTotal: 25000, paymentsCount: 5 },
  yuki: { paidYenTotal: 0, paymentsCount: 0 },
  dev: { paidYenTotal: 10000, paymentsCount: 2 },
  nabe: { paidYenTotal: 0, paymentsCount: 0 },
  kai: { paidYenTotal: 5000, paymentsCount: 1 },
  rim: { paidYenTotal: 10000, paymentsCount: 1 },
  ext: { paidYenTotal: 30000, paymentsCount: 1 },
  umi: { paidYenTotal: 20000, paymentsCount: 2 },
  abo: { paidYenTotal: 0, paymentsCount: 0 },
  ico: { paidYenTotal: 0, paymentsCount: 0 },
};

export function getSeederPayFacts(seeder: string): SeederPayFacts {
  const handle = seeder;
  const row = DUMMY_SEEDER_PAY[seeder.toLowerCase()];
  if (!row) {
    return { handle, paidYenTotal: 0, paymentsCount: 0 };
  }
  return { handle, ...row };
}

/** メンター面の事実（スコアではない）。件数を主、累計受取¥は透明性の副次 */
export type MentorFacts = {
  handle: string;
  /** コメントした作品数（参加） */
  participatedCount: number;
  /** 採用されたコメント数 */
  adoptedCount: number;
  /** チップを受け取った回数 */
  tipsReceivedCount: number;
  /** 累計受取額（事実。収入自慢用ではない） */
  tipsReceivedYenTotal: number;
};

export type MentorParticipation = {
  work: Work;
  adopted: boolean;
  tipped: boolean;
  commentSubject?: string;
};

/** デモ用。コメント author がハンドルと一致しないダミーへの上書き */
const DUMMY_MENTOR_FACTS: Record<
  string,
  Omit<MentorFacts, "handle">
> = {
  tori: {
    participatedCount: 4,
    adoptedCount: 5,
    tipsReceivedCount: 3,
    tipsReceivedYenTotal: 11000,
  },
  ken: {
    participatedCount: 3,
    adoptedCount: 2,
    tipsReceivedCount: 1,
    tipsReceivedYenTotal: 5000,
  },
  ayu: {
    participatedCount: 2,
    adoptedCount: 1,
    tipsReceivedCount: 0,
    tipsReceivedYenTotal: 0,
  },
};

/** デモ：参加作品ID（コメント author とハンドルが食い違う間の見た目用） */
const DUMMY_MENTOR_WORK_IDS: Record<string, string[]> = {
  tori: ["note-clip", "promo-15s", "novel-open", "closed-one"],
  ken: ["viscum-self", "note-clip", "lp-saas"],
  ayu: ["promo-15s", "viscum-self"],
};

function mentorFactsFromComments(handle: string): Omit<MentorFacts, "handle"> {
  const key = handle.replace(/^@/, "").toLowerCase();
  let adoptedCount = 0;
  let tipsReceivedCount = 0;
  let tipsReceivedYenTotal = 0;
  const workIds = new Set<string>();

  for (const w of DUMMY_WORKS) {
    for (const c of w.comments) {
      const authorKey = c.author.replace(/^@/, "").toLowerCase();
      if (authorKey !== key) continue;
      workIds.add(w.id);
      if (c.adopted) adoptedCount += 1;
      if (c.tipped) {
        tipsReceivedCount += 1;
        tipsReceivedYenTotal += c.tipYen ?? w.prizeYen ?? 0;
      }
    }
  }

  return {
    participatedCount: workIds.size,
    adoptedCount,
    tipsReceivedCount,
    tipsReceivedYenTotal,
  };
}

export function getMentorFacts(handle: string): MentorFacts {
  const h = handle.replace(/^@/, "");
  const fromComments = mentorFactsFromComments(h);
  const demo = DUMMY_MENTOR_FACTS[h.toLowerCase()];
  if (!demo) {
    return { handle: h, ...fromComments };
  }
  return {
    handle: h,
    participatedCount: Math.max(
      fromComments.participatedCount,
      demo.participatedCount,
    ),
    adoptedCount: Math.max(fromComments.adoptedCount, demo.adoptedCount),
    tipsReceivedCount: Math.max(
      fromComments.tipsReceivedCount,
      demo.tipsReceivedCount,
    ),
    tipsReceivedYenTotal: Math.max(
      fromComments.tipsReceivedYenTotal,
      demo.tipsReceivedYenTotal,
    ),
  };
}

/** メンターとしてコメントした作品一覧（二面ポートフォリオの書く棚） */
export function getWorksMentoredBy(handle: string): MentorParticipation[] {
  const h = handle.replace(/^@/, "");
  const key = h.toLowerCase();
  const byId = new Map<string, MentorParticipation>();

  for (const w of DUMMY_WORKS) {
    for (const c of w.comments) {
      const authorKey = c.author.replace(/^@/, "").toLowerCase();
      if (authorKey !== key) continue;
      const prev = byId.get(w.id);
      byId.set(w.id, {
        work: w,
        adopted: Boolean(prev?.adopted || c.adopted),
        tipped: Boolean(prev?.tipped || c.tipped),
        commentSubject: prev?.commentSubject ?? c.subject,
      });
    }
  }

  const demoIds = DUMMY_MENTOR_WORK_IDS[key] ?? [];
  for (const id of demoIds) {
    if (byId.has(id)) continue;
    const w = getWork(id);
    if (!w) continue;
    byId.set(id, {
      work: w,
      adopted: false,
      tipped: false,
      commentSubject: undefined,
    });
  }

  return [...byId.values()];
}

export function formatYen(n: number): string {
  return `¥${n.toLocaleString("ja-JP")}`;
}

export function formatHoursAgo(h: number): string {
  if (h < 1) return "たった今";
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  return `${d}日前`;
}

/** スケジュール帳に書きやすい日時（例: 2026/8/18 16:38） */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

/** フィード用の短い月日（例: 8/19） */
export function formatMonthDay(date: Date): string {
  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
  }).format(date);
}

export function postedAtFromHoursAgo(
  hoursAgo: number,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);
}

export function closesAtFromHours(
  closesInHours: number,
  now: Date = new Date(),
): Date {
  return new Date(now.getTime() + closesInHours * 60 * 60 * 1000);
}

/**
 * カウントダウン文言だけ。
 * 例: あと20時間／あと2日／まもなく／終了
 */
export function formatClosesIn(
  closesInHours: number | undefined,
  status: CompStatus,
): string | null {
  if (status === "none") return null;
  if (status === "closed") return "終了";
  if (closesInHours == null) return null;
  if (closesInHours <= 0) return "まもなく";
  if (closesInHours < 24) return `あと${closesInHours}時間`;
  const d = Math.floor(closesInHours / 24);
  const h = closesInHours % 24;
  if (h === 0) return `あと${d}日`;
  return `あと${d}日${h}時間`;
}

/** 投稿日：日時 */
export function formatPostedLine(
  hoursAgo: number,
  now: Date = new Date(),
): string {
  return formatDateTime(postedAtFromHoursAgo(hoursAgo, now));
}

/**
 * 締切：日時（あと●●）
 * closed / データなしはカウントダウンのみ or null
 */
export function formatDeadlineLine(
  closesInHours: number | undefined,
  status: CompStatus,
  now: Date = new Date(),
): string | null {
  const countdown = formatClosesIn(closesInHours, status);
  if (!countdown) return null;
  if (status === "closed" || closesInHours == null) return countdown;
  const when = formatDateTime(closesAtFromHours(closesInHours, now));
  return `${when}（${countdown}）`;
}

/** フィード用: 8/19（あと20時間） */
export function formatDeadlineFeed(
  closesInHours: number | undefined,
  status: CompStatus,
  now: Date = new Date(),
): string | null {
  const countdown = formatClosesIn(closesInHours, status);
  if (!countdown) return null;
  if (status === "closed" || closesInHours == null) return countdown;
  const md = formatMonthDay(closesAtFromHours(closesInHours, now));
  return `${md}（${countdown}）`;
}
