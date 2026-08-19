import type { Metadata } from "next";
import { auth } from "@/auth";
import { Providers } from "@/components/Providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "VISCUM（ヤドリギ）",
  description:
    "作ったものを出して、最初の反応を集める場所。場内コンペと公開ブースト。入場無料。",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  return (
    <html lang="ja">
      <body className="min-h-dvh antialiased">
        <Providers session={session}>{children}</Providers>
      </body>
    </html>
  );
}
