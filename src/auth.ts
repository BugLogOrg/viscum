import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

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
        name: input.name ?? existing[0].name,
        email: input.email ?? existing[0].email,
        image: input.image ?? existing[0].image,
      })
      .where(eq(users.id, input.id));
    return;
  }
  await db.insert(users).values({
    id: input.id,
    handle: input.handle,
    name: input.name,
    email: input.email,
    image: input.image,
  });
}

function handleFromEmail(email: string) {
  const base = email
    .split("@")[0]
    .replace(/[^a-zA-Z0-9_]/g, "")
    .slice(0, 24);
  return base || "seeder";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
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
            : "mDB";
        // 英語ID: 英数字と _ のみ（アカウント名はプロフィール側・ADR-029）
        const handle =
          raw.replace(/[^a-zA-Z0-9_]/g, "").slice(0, 24) || "mDB";
        const id = `demo:${handle}`;
        await upsertUser({
          id,
          handle,
          name: handle,
          email: `${handle}@demo.viscum.local`,
        });
        return { id, name: handle, email: `${handle}@demo.viscum.local`, handle };
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
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.handle =
          user.handle ||
          (user.email ? handleFromEmail(user.email) : "seeder");
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = (token.id as string) || "";
        session.user.handle = (token.handle as string) || "seeder";
      }
      return session;
    },
  },
});
