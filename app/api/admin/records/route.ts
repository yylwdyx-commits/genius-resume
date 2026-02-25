import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const records = await prisma.jobRecord.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true,
      company: true,
      jdTitle: true,
      results: true,
      createdAt: true,
      user: { select: { id: true, name: true, email: true, image: true } },
    },
  });

  return NextResponse.json(records);
}
