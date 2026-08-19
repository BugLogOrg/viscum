import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Resend from "next-auth/providers/resend";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { getDb, hasDatabase } from "@/db";
import { accounts, users, verificationTokens } from "@/db/schema";
import { isReservedDemoHandle } from "@/data/suggested-seeders";

async function upsertUser(input: {
  id: string;
  handle: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
}) {
  const db = getDb();
  if (!db) return;
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.id, input.id))
    .limit(1);
  if (existing[0]) {
    await db
      .update(users)
      .set({
        handle: input.handle,
        name:
          existing[0].name != null && existing[0].name !== ""
            ? existing[0].name
            : (input.name ?? existing[0].name),
        email: input.email ?? existing[0].email,
        image: input.image ?? existing[0].image,
      })
      .where(eq(users.id, input.id));
    return;
  }
  await db.insert(users).values({
    id: input.id,
    handle: input.handle,
    name: input.name ?? input.handle,
    email: input.email,
    image: input.image,
  });
}

async function loadUserFlags(userId: string): Promise<{
  handle: string | null;
  onboardingDone: boolean;
}> {
  const db = getDb();
  if (!db) return { handle: null, onboardingDone: true };
  const rows = await db
    .select({
      handle: users.handle,
      onboardingCompletedAt: users.onboardingCompletedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  const row = rows[0];
  let handle = row?.handle ?? null;
  // デモ棚IDを実アカウントが掴んでいたら解放し、英語ID選び直しへ
  if (handle && isReservedDemoHandle(handle) && !userId.startsWith("demo:")) {
    await db
      .update(users)
      .set({ handle: null })
      .where(eq(users.id, userId));
    handle = null;
  }
  return {
    handle,
    onboardingDone: Boolean(row?.onboardingCompletedAt),
  };
}

function handleFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 24);
  return base || "seeder";
}

const db = getDb();
const resendKey = process.env.RESEND_API_KEY?.trim();
const emailFrom =
  process.env.EMAIL_FROM_ADDRESS?.trim() || "noreply@mail.viscum.org";

const magicLinkEnabled = Boolean(db && resendKey);

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    verifyRequest: "/login/check-email",
    error: "/login",
  },
  ...(db
    ? {
        adapter: DrizzleAdapter(db, {
          usersTable: users,
          accountsTable: accounts,
          verificationTokensTable: verificationTokens,
        }),
      }
    : {}),
  providers: [
    ...(magicLinkEnabled
      ? [
          Resend({
            apiKey: resendKey,
            from: `VISCUM <${emailFrom}>`,
            async sendVerificationRequest({ identifier, url }) {
              const { host } = new URL(url);
              const res = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${resendKey}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  from: `VISCUM <${emailFrom}>`,
                  to: [identifier],
                  subject: "【VISCUM】ログイン用リンク",
                  text: [
                    "VISCUM へのログインリンクです。",
                    "",
                    url,
                    "",
                    `有効期限が過ぎた場合は、もう一度ログイン画面から送ってください。`,
                    `（${host}）`,
                  ].join("\n"),
                  html: `
                    <p>VISCUM へのログインリンクです。</p>
                    <p><a href="${url}">ログインする</a></p>
                    <p style="color:#666;font-size:12px">リンクが開けない場合は次のURLをブラウザに貼ってください。<br/>${url}</p>
                    <p style="color:#666;font-size:12px">有効期限が過ぎた場合は、もう一度ログイン画面から送ってください。</p>
                  `,
                }),
              });
              if (!res.ok) {
                const body = await res.text();
                throw new Error(`Resend error ${res.status}: ${body}`);
              }
            },
          }),
        ]
      : []),
    ...(process.env.AUTH_GITHUB_ID && process.env.AUTH_GITHUB_SECRET
      ? [
          GitHub({
            clientId: process.env.AUTH_GITHUB_ID,
            clientSecret: process.env.AUTH_GITHUB_SECRET,
          }),
        ]
      : []),
    Credentials({
      id: "demo",
      name: "デモログイン",
      credentials: {
        handle: { label: "ハンドル", type: "text" },
      },
      async authorize(credentials) {
        const demoOk =
          process.env.AUTH_DEMO_ENABLED !== "false" &&
          (process.env.NODE_ENV === "development" ||
            process.env.AUTH_DEMO_ENABLED === "true");
        if (!demoOk) return null;
        const raw =
          typeof credentials?.handle === "string" && credentials.handle.trim()
            ? credentials.handle.trim()
            : "guest";
        const handle =
          raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24) || "guest";
        const id = `demo:${handle}`;
        await upsertUser({
          id,
          handle,
          email: `${handle}@demo.viscum.local`,
        });
        return {
          id,
          name: handle,
          email: `${handle}@demo.viscum.local`,
          handle,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "github" && user.id) {
        const handle =
          user.handle ||
          (user.email ? handleFromEmail(user.email) : null) ||
          user.name?.replace(/\s+/g, "").slice(0, 24) ||
          `gh${user.id.slice(0, 8)}`;
        await upsertUser({
          id: user.id,
          handle,
          name: user.name,
          email: user.email,
          image: user.image,
        });
        user.handle = handle;
      }
      // resend: handle はオンボーディングで決める（adapter が user を作る）
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        const s = session as
          | { handle?: string; onboardingDone?: boolean }
          | undefined;
        if (s?.handle) {
          token.handle = s.handle;
          token.needsHandle = false;
          // 歓迎表示などが name を見ても古い呼び名（メール由来）に戻らないように
          token.name = s.handle;
        }
        if (s?.onboardingDone) {
          token.needsOnboarding = false;
        }
      }
      if (user?.id) {
        token.id = user.id;
      }
      const id = (token.id as string | undefined) || user?.id;
      if (id && hasDatabase() && trigger !== "update") {
        const flags = await loadUserFlags(id);
        token.handle = flags.handle ?? undefined;
        token.needsHandle = !flags.handle;
        token.needsOnboarding = Boolean(flags.handle) && !flags.onboardingDone;
      } else if (user?.handle) {
        token.handle = user.handle;
        token.needsHandle = false;
        // デモ新規は DB 側フラグを次の jwt で読む。ここは仮で完了扱いにしない
        if (id && hasDatabase()) {
          const flags = await loadUserFlags(id);
          token.needsOnboarding =
            Boolean(flags.handle) && !flags.onboardingDone;
        } else {
          token.needsOnboarding = false;
        }
      }
      // handle 更新直後: onboarding がまだなら要ウェルカム
      if (
        trigger === "update" &&
        id &&
        hasDatabase() &&
        !(session as { onboardingDone?: boolean } | undefined)?.onboardingDone
      ) {
        const flags = await loadUserFlags(id);
        token.needsOnboarding = Boolean(flags.handle) && !flags.onboardingDone;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.handle = (token.handle as string) || "";
        session.user.needsHandle = Boolean(token.needsHandle);
        session.user.needsOnboarding = Boolean(token.needsOnboarding);
      }
      return session;
    },
  },
});
