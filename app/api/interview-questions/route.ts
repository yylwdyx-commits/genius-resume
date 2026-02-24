import { NextRequest } from "next/server";
import { createClaudeStream } from "@/lib/claude";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { jd, resume, company } = await req.json();

    if (!jd) {
      return new Response(
        JSON.stringify({ error: "JD is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `你是一位资深的技术面试官和HR专家，拥有丰富的面试出题经验。
你能根据职位描述和候选人背景，精准预测面试中最可能出现的问题，并提供答题思路。`;

    const userMessage = `
目标公司：${company || "未提供"}

【职位描述（JD）】
${jd}

【候选人简历】
${resume || "未提供简历，请基于JD生成通用面试题"}

请生成一份完整的面试备考题库，格式如下：

## 🔧 技术/专业题（8-10题）
针对岗位核心技能的专业问题，每题附带：
- 问题
- 考察重点
- 答题思路提示

## 🎯 行为面试题（5-6题）
用STAR法则框架的行为问题，每题附带：
- 问题
- 考察的软技能
- 建议结合简历哪些经历来回答

## 💡 情景题（3-4题）
假设情景判断题，考察实际工作处理能力

## ❓ 反问环节
推荐3-5个向面试官反问的高质量问题，展示对公司和岗位的深入思考

请用中文，保证题目实用、有针对性。`;

    const stream = createClaudeStream(systemPrompt, userMessage);

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Interview questions error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate interview questions" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
