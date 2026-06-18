import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SYSTEM_PROMPT = `당신은 '경남 지산학연 네트워크 플랫폼'의 AI 도우미입니다.
경남 지역 산업체·대학·연구기관의 협력을 지원합니다.
질문자가 한국어로 물으면 한국어로, 영어로 물으면 영어로 답합니다.
플랫폼 기능(기관 등록, 인적자원, 물적자원, 아이디어 협업, 인재 채용, 공지 등)을 안내합니다.
답변은 간결하고 실용적으로 제공하되, 전문적인 내용도 쉽게 설명합니다.`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { messages }: { messages: Message[] } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "messages array is required" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-20), // 최근 20개 메시지만 컨텍스트로 유지
      ],
      max_tokens: 1024,
      temperature: 0.7,
    });

    const reply = completion.choices[0]?.message?.content ?? "응답을 생성하지 못했습니다.";

    return NextResponse.json({ reply });
  } catch (err: unknown) {
    console.error("[ai-chat]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
