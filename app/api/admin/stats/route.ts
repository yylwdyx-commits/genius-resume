import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const [totalUsers, totalRecords, recordsToday, newUsersThisWeek] = await Promise.all([
    prisma.user.count(),
    prisma.jobRecord.count(),
    prisma.jobRecord.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),
  ]);

  return NextResponse.json({ totalUsers, totalRecords, recordsToday, newUsersThisWeek });
}
