export type CompStatus = "none" | "open" | "pay_soon" | "closed";

export type Comment = {
  id: string;
  author: string;
  /** 一覧行に出す件名・見出し（GmailのSubject相当） */
  subject: string;
  body: string;
  hoursAgo: number;
  adopted?: boolean;
  /** 採用後にチップ／賞金を支払済み */
  tipped?: boolean;
  tipYen?: number;
};

export type Work = {
  id: string;
  title: string;
  tagline: string;
  seeder: string;
  tags: string[];
  status: CompStatus;
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
  comments: Comment[];
  paymentsDone?: number;
};

export const DUMMY_WORKS: Work[] = [
  {
    id: "viscum-self",
    title: "個人が作ったアプリや動画を速報棚に載せて、少額のコメントコンペを広告費としてばらまけるか——Viscum（ヤドリギ候補）自体の初見レビュー募集。開催中バッジと金額、払う顔は伝わる？稼ぐ副業っぽく見えない？名前・色・初動の迷いを一言ください。厳しめで短くて大丈夫です。",
    tagline: "少額コンペ＝少額広告の顔は伝わるか",
    seeder: "mDB",
    tags: ["アプリ", "告知"],
    status: "open",
    prizeYen: 3000,
    hoursAgo: 2,
    closesInHours: 46,
    featured: true,
    description:
      "個人制作物の速報棚＋任意コンペの装置です。初見で迷いやすいところ、払いたくなるか、名前の印象を一言ください。",
    prompts: ["初見の分かりやすさ", "払いたくなるか", "名前の印象"],
    externalUrl: "https://viscum.org",
    thumbTone: "leaf",
    paymentsDone: 0,
    comments: [
      {
        id: "c1",
        author: "メンターA",
        subject: "開催中バッジで安心。稼ぐ顔だと違う場に見える",
        body: "トップの開催中バッジと金額が一目で分かって安心しました。もしLPや導線が「稼ごう／ポイ活」寄りだと、UluやPolishと同列の仕事板に見えてしまいます。Viscumは『広告費の出口』なので、シーダー主語のまま押し切った方が差別化になります。細かい点では、詳細に入る前に一言がtruncateされているのもスキャンしやすいです。",
        hoursAgo: 1,
        adopted: true,
      },
      {
        id: "c2",
        author: "レビュアーB",
        subject: "一覧はサムネ＋見出し、コメントは詳細で展開が正解",
        body: "大量にコンペが並ぶ前提なら、フィードにコメント本文を出すと縦に死にます。Product Hunt型で見出しとサムネに寄せ、コメントは作品詳細へ。さらにコメント自体も長文になりうるので、件名だけ見せて本文はGmailのように展開できると、シーダーもメンターも読みやすいと思います。",
        hoursAgo: 3,
      },
      {
        id: "c3",
        author: "作り手C",
        subject: "¥3,000は『広告費』と言い換えるとDMしやすい",
        body: "知人にタダで見て、より他人に『払うから参加して』の方が心理的に楽、という仮説に近いです。金額もワンコインだとポイ活顔、¥3,000なら本気シグナルになる。コピーに『広告費として』を添える案は、紙コンペの募集文でも試せそうです。",
        hoursAgo: 5,
      },
      {
        id: "c4",
        author: "観察D",
        subject: "色は温かい。紫テックにしない判断が良い",
        body: "ヤドリギの緑と実の赤橙、紙クリームの組み合わせは浜の温度に合っています。初期からダークネオンや紫グラデにすると、思想の海岸線とズレます。サムネが色面仮置きでも、トンマナが通っていると『同じ場の祭り』に見えます。",
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
    prizeYen: 5000,
    hoursAgo: 4,
    closesInHours: 20,
    description: "起床後3行だけ書くメモ。通知とウィジェットの初見を見てほしい。",
    prompts: ["オンボーディング", "通知のうざさ"],
    externalUrl: "https://example.com/memo",
    thumbTone: "moss",
    comments: [
      {
        id: "c1",
        author: "早起きE",
        subject: "最初の画面が空白すぎる",
        body: "起動直後が真っ白で、何をするアプリか3秒迷いました。『今朝の3行』というプレースホルダか、昨日の続きが一瞬見えると安心します。通知の文言も『書け』より『今日の一行目』の方が優しそうです。",
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
    prizeYen: 3000,
    hoursAgo: 6,
    closesInHours: 8,
    description: "YouTube Shorts用。見る範囲は冒頭15秒だけでOK。",
    prompts: ["冒頭の伝わり方", "音なしでも分かるか"],
    externalUrl: "https://example.com/video",
    thumbTone: "berry",
    comments: [],
  },
  {
    id: "novel-open",
    title: "短編『団地の屋上』のあらすじと冒頭800字だけ公開します。続きが読みたくなる温度感か、一人目の印象は残るか。全文ではなく入口だけのレビュー募集です。タイトル案や刺さった一文、あらすじの長さの負荷感も大歓迎。小説タグのメンター向けコンペなので、厳しめでお願いします。",
    tagline: "あらすじ＋冒頭800字の温度感",
    seeder: "sana",
    tags: ["小説", "短編", "冒頭"],
    status: "open",
    prizeYen: 10000,
    hoursAgo: 9,
    closesInHours: 72,
    description: "全文ではなく冒頭のみ。続きが読みたくなるかだけ見てほしい。",
    prompts: ["続きが欲しいか", "一人目の印象"],
    externalUrl: "https://example.com/novel",
    thumbTone: "bark",
    comments: [
      {
        id: "c1",
        author: "読者F",
        subject: "屋上の匂いで残った。タイトル案あり",
        body: "冒頭の『コンクリートが昼の熱を吐いている』あたりで続きが欲しくなりました。一人目の声がもう半歩早く入ると、誰の物語か掴みやすいです。タイトル案として『屋上の鍵』『団地の風向き』も候補になりそうです。あらすじは短めでちょうどよい負荷でした。",
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
    prizeYen: 3000,
    hoursAgo: 12,
    closesInHours: 30,
    description: "決済UIはまだ準備中。コメントは歓迎、チップ確定は後から。",
    prompts: ["ターゲットの伝わり方"],
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
    prizeYen: 3000,
    hoursAgo: 18,
    closesInHours: 54,
    description: "Chrome拡張。インストール〜最初のグループ作成まで。",
    prompts: ["権限説明の怖さ", "命名UI"],
    externalUrl: "https://example.com/ext",
    thumbTone: "leaf",
    comments: [],
  },
  {
    id: "podcast-cover",
    title: "ポッドキャスト封面の大喜利コンペです。真面目な添削より、タイトル案・一言ツッコミ・サムネの第一印象をください。音声番組の顔としてクリックしたくなるか。短くて尖った案ほど採用しやすいです。¥3,000帯の軽量祭りなので気軽に。色・フォント・余白の違和感の指摘も歓迎しています。",
    tagline: "タイトル案を一言で",
    seeder: "wave",
    tags: ["音声", "大喜利"],
    status: "open",
    prizeYen: 3000,
    hoursAgo: 22,
    closesInHours: 12,
    description: "真面目な添削よりタイトル・一言ツッコミ歓迎。",
    prompts: ["タイトル案", "サムネの印象"],
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
        body: "メイン導線から設定までタップが一つ多く、親指ゾーンの外に重要項目がありました。終了コンペのアーカイブとして残すなら、『採用済み』が件名横にあるとシーダーの学びログにもなります。長文レビューも件名だけで流し読みできると助かります。",
        hoursAgo: 40,
        adopted: true,
        tipped: true,
        tipYen: 5000,
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
    seeder: "mDB",
    tags: ["アプリ", "決済"],
    status: "open",
    prizeYen: 5000,
    hoursAgo: 5,
    closesInHours: 28,
    paymentsDone: 0,
    featured: true,
    description:
      "決済準備中の先＝採用時支払いの直前。コメントは採用済みだが、まだ Checkout していない状態のデモです。",
    prompts: ["採用して支払うの文言", "金額の再確認"],
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
    prizeYen: 5000,
    hoursAgo: 3,
    closesInHours: 36,
    description: "Figmaプロト。見る範囲は最初の3タップまで。",
    prompts: ["親指で届くか", "戻る位置"],
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
    prizeYen: 3000,
    hoursAgo: 7,
    closesInHours: 96,
    description: "リポジトリのREADMEとgifだけ。実際のinstallは不要。",
    prompts: ["何をするツールか", "怖そうなコマンドはないか"],
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
    hoursAgo: 11,
    description: "コンペなしの公開。感想歓迎。",
    externalUrl: "https://example.com/recipe",
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
    prizeYen: 3000,
    hoursAgo: 1,
    closesInHours: 18,
    description: "PDF1枚。初見の視線と誤解ポイントをください。",
    prompts: ["何のサービスか分かる", "次に何してほしいか"],
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
    prizeYen: 4000,
    hoursAgo: 5,
    closesInHours: 40,
    description: "音声のみ。導入の長さとトーン。",
    externalUrl: "https://example.com/pod",
    thumbTone: "trunk",
    comments: [],
  },
  {
    id: "chrome-ext-store",
    title: "タブ整理Chrome拡張のストア提出前チェックです。説明文とスクショ3枚だけで、権限ダイアログが怖く見えないか、何が片付く拡張か分かるか。決済準備中のコンペです。インストールしたくなるコピーか、警戒が勝つか、スクショの順序の良し悪しも教えてください。短文の一票で構いません。",
    tagline: "権限ダイアログが怖くないか",
    seeder: "ext",
    tags: ["ツール", "アプリ"],
    status: "pay_soon",
    prizeYen: 3000,
    hoursAgo: 9,
    closesInHours: 24,
    description: "ストア説明文とスクショ3枚。",
    externalUrl: "https://example.com/ext",
    thumbTone: "leaf",
    comments: [],
  },
  {
    id: "short-story",
    title: "掌編『バス停の傘』約2000字のレビュー募集です。結末の余韻の切れ方だけ重点的に見てほしい。途中の描写より、最後の一文が残るか。タイトルと結末の対応も気になっています。ネタバレを件名に書いても大丈夫です。長さの負荷感と、読み直ししたいかどうかも一言ください。小説メンター向け。",
    tagline: "余韻の切れ方",
    seeder: "umi",
    tags: ["小説"],
    status: "open",
    prizeYen: 5000,
    hoursAgo: 14,
    closesInHours: 60,
    description: "2000字。結末の一言だけ見てほしい。",
    externalUrl: "https://example.com/story2",
    thumbTone: "moss",
    comments: [],
  },
  {
    id: "landing-ab",
    title: "LPヒーロー文案A/Bのどちらが「払う気」になるか選んで、理由を件名に書いてください。個人プロダクトの少額コンペ誘導用です。煽りすぎず、でも弱いと消える——その境界のレビューが欲しいです。スクショ2案を見比べて一票を。禁止語感や企業LPっぽさの指摘も大歓迎しています。",
    tagline: "どっちが『払う気』になるか",
    seeder: "abo",
    tags: ["Web", "告知"],
    status: "open",
    prizeYen: 8000,
    hoursAgo: 2,
    closesInHours: 14,
    description: "2案のスクショ。選んだ理由を件名に。",
    prompts: ["どちらを選ぶか", "理由一言"],
    externalUrl: "https://example.com/lp",
    thumbTone: "bark",
    comments: [],
  },
  {
    id: "icon-set",
    title: "アプリアイコン案4種の識別チェック（コンペなし）です。小さいサイズでも何のアプリか分かるか、ヤドリギっぽさと汎用アイコンの間でどれが強いか。好き嫌いベースで大丈夫です。ホーム画面に並んだ想像での一言コメント歓迎。似て見える組や、潰れて読めない案があれば教えてください。",
    tagline: "小さいサイズでも識別できるか",
    seeder: "ico",
    tags: ["デザイン"],
    status: "none",
    hoursAgo: 20,
    description: "コンペなし。好き嫌いコメント歓迎。",
    externalUrl: "https://example.com/icon",
    thumbTone: "berry",
    comments: [],
  },
];

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
  mdb: { paidYenTotal: 48000, paymentsCount: 12 },
  ayu: { paidYenTotal: 15000, paymentsCount: 3 },
  ken: { paidYenTotal: 9000, paymentsCount: 2 },
  sana: { paidYenTotal: 3000, paymentsCount: 1 },
  rio: { paidYenTotal: 0, paymentsCount: 0 },
  moss: { paidYenTotal: 6000, paymentsCount: 2 },
  tab: { paidYenTotal: 12000, paymentsCount: 4 },
  wave: { paidYenTotal: 3000, paymentsCount: 1 },
  neo: { paidYenTotal: 21000, paymentsCount: 5 },
  yuki: { paidYenTotal: 0, paymentsCount: 0 },
  dev: { paidYenTotal: 8000, paymentsCount: 2 },
  nabe: { paidYenTotal: 0, paymentsCount: 0 },
  kai: { paidYenTotal: 5000, paymentsCount: 1 },
  rim: { paidYenTotal: 10000, paymentsCount: 2 },
  ext: { paidYenTotal: 3000, paymentsCount: 1 },
  umi: { paidYenTotal: 15000, paymentsCount: 3 },
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
