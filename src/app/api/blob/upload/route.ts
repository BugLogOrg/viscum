import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { auth } from "@/auth";

/**
 * Vercel Blob クライアント直アップロード用トークン発行。
 * ブラウザ → Blob（関数ボディを通さない＝4.5MB制限を避ける）
 */
export async function POST(request: Request): Promise<NextResponse> {
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN 未設定。Vercel の Blob ストアを接続してください。",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => {
        const session = await auth();
        const handle = session?.user?.handle?.replace(/^@/, "").trim();
        if (!session?.user?.id || !handle) {
          throw new Error("画像アップロードにはログイン（英語ID）が必要です");
        }
        return {
          /** クライアントで JPEG 圧縮済みのみ受け付ける */
          allowedContentTypes: ["image/jpeg"],
          /** 圧縮後の上限（Hobby無料枠前提・原寸直上げ拒否） */
          maximumSizeInBytes: 320_000,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({
            userId: session.user.id,
            handle,
          }),
        };
      },
      onUploadCompleted: async () => {
        // localhost では届かないことがある。URL はクライアント upload() の戻りを正とする
      },
    });
    return NextResponse.json(jsonResponse);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 },
    );
  }
}

/** UI が Blob 利用可否を知る */
export async function GET() {
  return NextResponse.json({
    configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()),
    provider: "vercel-blob",
    maxImages: 6,
    billing: "hobby-free-cap",
  });
}
