import type { Metadata } from "next";
import { Noto_Serif_JP } from "next/font/google";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import { siteOrigin } from "@/lib/work-og";
import "./globals.css";

/** 入口一文など、UIゴシックと差をつける表示用 */
const displaySerif = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-viscum-display",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteOrigin()),
  title: {
    default: "VISCUM ｜ 作品×反応×コンペ",
    template: "VISCUM ｜ %s",
  },
  description:
    "作ったものを出して、最初の反応を集める場所。VISCUM内コンペと公開ブースト。入場無料。",
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "VISCUM",
    title: "VISCUM ｜ 作品×反応×コンペ",
    description:
      "作ったものを出して、最初の反応を集める場所。VISCUM内コンペと公開ブースト。入場無料。",
  },
  twitter: {
    card: "summary_large_image",
    title: "VISCUM ｜ 作品×反応×コンペ",
    description:
      "作ったものを出して、最初の反応を集める場所。VISCUM内コンペと公開ブースト。入場無料。",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html lang="ja" className={displaySerif.variable}>
      <body className="min-h-dvh antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
