import { NextRequest } from "next/server";
import { createClaudeStream } from "@/lib/claude";

export const runtime = "nodejs";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: NextRequest) {
  try {
    const { jd, resume, company, messages, userMessage, language } = await req.json();

    if (!userMessage) {
      return new Response(
        JSON.stringify({ error: "userMessage is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const langInstruction = language && language !== 'en' ? `\n\nIMPORTANT: You must respond entirely in ${language === 'zh' ? 'Simplified Chinese' : language === 'tw' ? 'Traditional Chinese' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'pt' ? 'Portuguese' : language === 'ar' ? 'Arabic' : 'English'}. Do not use any other language.` : '';

    const systemPrompt = `你是一位专业的求职顾问助理。

当前求职背景：
- 目标公司：${company || "未填写"}
- 职位描述：${jd ? jd.slice(0, 600) : "未填写"}
- 用户简历：${resume ? resume.slice(0, 600) : "未填写"}

你可以帮助用户解答关于职位/公司/简历/面试的任何问题，进行自由对话。
用中文回复，简洁有力。${langInstruction}`;

    const history: Message[] = messages || [];

    const stream = createClaudeStream(systemPrompt, userMessage, history);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
