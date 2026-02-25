import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const FREE_RECORD_LIMIT = 3;

// GET /api/records — list current user's records
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const records = await prisma.jobRecord.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      company: true,
      jdTitle: true,
      results: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(records);
}

// POST /api/records — create a new record
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, customApiKey: true },
  });

  // Free users without BYOK are limited to 3 records
  if (user?.plan === "free" && !user?.customApiKey) {
    const count = await prisma.jobRecord.count({ where: { userId: session.user.id } });
    if (count >= FREE_RECORD_LIMIT) {
      return NextResponse.json({ error: "limit_reached" }, { status: 402 });
    }
  }

  const { company, jdContent, resume } = await req.json();
  const jdTitle = (jdContent as string)?.slice(0, 60) ?? "";

  const record = await prisma.jobRecord.create({
    data: {
      userId: session.user.id,
      company: company ?? "",
      jdTitle,
      jdContent: jdContent ?? "",
      resume: resume ?? "",
      results: "{}",
    },
  });

  return NextResponse.json({ id: record.id });
}
