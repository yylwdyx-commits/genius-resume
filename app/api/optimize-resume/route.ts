import { NextRequest } from "next/server";
import { createClaudeStream } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { jd, resume, company, language } = await req.json();

    if (!jd || !resume) {
      return new Response(
        JSON.stringify({ error: "JD and resume are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const langInstruction = language && language !== 'en' ? `\n\nIMPORTANT: You must respond entirely in ${language === 'zh' ? 'Simplified Chinese' : language === 'tw' ? 'Traditional Chinese' : language === 'ja' ? 'Japanese' : language === 'ko' ? 'Korean' : language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : language === 'de' ? 'German' : language === 'pt' ? 'Portuguese' : language === 'ar' ? 'Arabic' : 'English'}. Do not use any other language.` : '';

    const systemPrompt = `你是一位专业的简历优化顾问，擅长将候选人的简历与目标职位进行深度匹配。
你的任务是：
1. 分析职位描述（JD）中的核心要求、关键词和能力模型
2. 对照候选人简历，找出匹配点和可强化的地方
3. 用JD的话语体系重新表述简历中的相关经历和成就
4. 突出与岗位最相关的技能和经验
5. 使用量化数据（如有）增强说服力

输出格式：
- 先给出【匹配分析】：JD核心要求与简历现有内容的对比
- 再给出【优化建议】：每个简历模块的改写建议（工作经历/项目经历/技能等）
- 最后给出【优化后的简历片段】：直接可用的改写版本

语言风格：专业、精炼、有力，符合该岗位的行业表达习惯。${langInstruction}`;

    const userMessage = `
目标公司：${company || "未提供"}

【职位描述（JD）】
${jd}

【当前简历】
${resume}

请帮我优化简历，使其与该职位高度匹配。`;

    const stream = createClaudeStream(systemPrompt, userMessage);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Resume optimize error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to optimize resume" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
