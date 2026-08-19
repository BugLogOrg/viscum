import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VISCUM（ヤドリギ候補）",
  description:
    "個人制作物の場。少額コンペ＝少額広告。入場無料で盛り上がりを楽しめる。",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
