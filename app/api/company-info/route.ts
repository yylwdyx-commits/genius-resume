import { NextRequest, NextResponse } from "next/server";
import { tavilySearch } from "@/lib/tavily";

export const runtime = "nodejs";

const BLOCKED_DOMAINS = [
  "baidu.com",
  "zhihu.com",
  "wikipedia.org",
  "weibo.com",
  "wikidata.org",
  "baike.baidu.com",
  "sogou.com",
  "360.cn",
];

function isBlockedDomain(url: string): boolean {
  return BLOCKED_DOMAINS.some((d) => url.includes(d));
}

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { company } = await req.json();
    if (!company?.trim()) {
      return NextResponse.json({ error: "Company name required" }, { status: 400 });
    }

    const results = await tavilySearch(`${company} 公司官网简介`, 3);
    const filtered = results.results.filter((r) => !isBlockedDomain(r.url));
    const first = filtered[0];

    if (!first) {
      return NextResponse.json({ description: "", website: "", domain: "" });
    }

    const domain = extractDomain(first.url);
    const description = first.content.slice(0, 200).replace(/\s+/g, " ").trim();

    return NextResponse.json({ description, website: first.url, domain });
  } catch (error) {
    console.error("Company info error:", error);
    return NextResponse.json({ error: "Failed to fetch company info" }, { status: 500 });
  }
}
