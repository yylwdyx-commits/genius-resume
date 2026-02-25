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

    const systemPrompt = `你是一位严格但公正的面试官，正在对候选人进行面试。

面试背景：
- 目标公司：${company || "某科技公司"}
- 职位描述：${jd ? jd.slice(0, 800) : "未提供"}
- 候选人简历：${resume ? resume.slice(0, 800) : "未提供"}

你的角色要求：
1. 用专业、自然的对话方式进行面试
2. 根据候选人的回答追问细节，深入挖掘
3. 适时提出新的面试问题（技术题、行为题、情景题交替）
4. 对回答给出简短的即时反馈（认可好的地方，对不足之处追问）
5. 保持面试节奏，不要一次问太多问题
6. 用中文交流

开始面试时，先做自我介绍并问第一个问题。
如果候选人说"结束面试"或"面试结束"，给出综合评价和改进建议。${langInstruction}`;

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
    console.error("Mock interview error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process mock interview" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
