import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminMessaging } from "@/lib/firebase-admin";
import type { NoticeCategory } from "@/types";

export const dynamic = "force-dynamic";

interface RequestBody {
  noticeId: string;
  title: string;
  category: NoticeCategory;
  tags: string[];
}

export async function POST(req: NextRequest) {
  try {
    const body: RequestBody = await req.json();
    const { noticeId, title, category, tags } = body;

    if (!noticeId || !title) {
      return NextResponse.json({ error: "noticeId and title are required" }, { status: 400 });
    }

    const db = adminDb();

    // 관심 키워드 중 tags와 겹치는 사용자 FCM 토큰 수집
    const usersSnap = await db
      .collection("users")
      .where("approved", "==", true)
      .get();

    const tokens: string[] = [];

    usersSnap.forEach((doc) => {
      const user = doc.data();
      const interests: string[] = user.interests ?? [];
      const fcmToken: string | undefined = user.fcmToken;

      if (!fcmToken) return;

      // 카테고리 자체가 관심사에 있거나 tags가 겹치면 발송
      const categoryMatch = interests.includes(category);
      const tagMatch = tags.some((tag) => interests.includes(tag));

      if (categoryMatch || tagMatch || interests.length === 0) {
        tokens.push(fcmToken);
      }
    });

    if (tokens.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    // FCM Multicast
    const response = await adminMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "새 공지·공고",
        body: title,
      },
      data: {
        noticeId,
        category,
        url: `/dashboard/notices`,
      },
      webpush: {
        fcmOptions: {
          link: `/dashboard/notices`,
        },
      },
    });

    return NextResponse.json({
      sent: response.successCount,
      failed: response.failureCount,
    });
  } catch (err: unknown) {
    console.error("[send-notification]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
