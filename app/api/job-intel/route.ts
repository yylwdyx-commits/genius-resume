import { NextRequest, NextResponse } from "next/server";
import { tavilySearch } from "@/lib/tavily";
import { checkAccess } from "@/lib/planCheck";
import { createAICompletion } from "@/lib/aiClient";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const access = await checkAccess("job-intel");
  if (!access.allowed) {
    return NextResponse.json(
      { error: access.reason },
      { status: access.reason === "unauthenticated" ? 401 : 402 }
    );
  }

  try {
    const { company, jd, language } = await req.json();

    if (!company) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    const queries = [
      `${company} 公司 员工评价 口碑 glassdoor`,
      `${company} 面试经历 面试流程 面试题`,
      `${company} 公司文化 工作氛围 福利待遇`,
      `${company} 最新新闻 发展动态 2024 2025`,
    ];

    const searchResults = await Promise.allSettled(
      queries.map((q) => tavilySearch(q, 4))
    );

    const allResults: string[] = [];
    searchResults.forEach((result, idx) => {
      if (result.status === "fulfilled") {
        result.value.results.forEach((r) => {
          allResults.push(`【来源：${r.url}】\n标题：${r.title}\n内容：${r.content}\n`);
        });
        if (result.value.answer) {
          allResults.push(`【搜索摘要（查询${idx + 1}）】：${result.value.answer}\n`);
        }
      }
    });

    const searchContext = allResults.join("\n---\n").slice(0, 12000);

    const langInstruction = language && language !== "en"
      ? `\n\nIMPORTANT: You must respond entirely in ${language === "zh" ? "Simplified Chinese" : language === "tw" ? "Traditional Chinese" : language === "ja" ? "Japanese" : language === "ko" ? "Korean" : language === "es" ? "Spanish" : language === "fr" ? "French" : language === "de" ? "German" : language === "pt" ? "Portuguese" : language === "ar" ? "Arabic" : "English"}. Do not use any other language.`
      : "";

    const systemPrompt = `你是一位专业的职场情报分析师，擅长从互联网信息中提炼对求职者有价值的公司情报。
你的分析应该：客观、实用、有洞察力，帮助求职者在面试前做好充分准备。${langInstruction}`;

    const userMessage = `
目标公司：${company}
目标岗位信息：${jd ? jd.slice(0, 500) : "未提供"}

以下是从互联网收集到的相关信息：

${searchContext}

请基于以上信息，生成一份完整的【公司情报报告】，包含以下部分：

## 📊 公司基本情况
（规模、行业地位、近期动态）

## 💬 员工口碑
（薪资待遇、工作强度、管理风格、优缺点）

## 🎯 面试情报
（面试流程、常见问题类型、注意事项）

## 🏢 公司文化
（团队氛围、价值观、发展机会）

## ⚡ 求职建议
（针对该公司的面试策略、需要着重准备的方向）

如果某些信息不足，请注明"信息有限"并给出合理推断。用中文回复。`;

    const report = await createAICompletion(systemPrompt, userMessage, access.userConfig);

    return NextResponse.json({ report, sourcesCount: allResults.length });
  } catch (error) {
    console.error("Job intel error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: `Failed to fetch job intel: ${message}` },
      { status: 500 }
    );
  }
}
