import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      plan: true,
      usageCount: true,
      usageResetAt: true,
      planExpiry: true,
      customProvider: true,
      customModel: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Show 0 if it's a new month (will reset on next optimize call)
  const now = new Date();
  const resetAt = new Date(user.usageResetAt);
  const isNewMonth =
    now.getFullYear() !== resetAt.getFullYear() ||
    now.getMonth() !== resetAt.getMonth();

  return NextResponse.json({
    plan: user.plan,
    usageCount: isNewMonth ? 0 : user.usageCount,
    planExpiry: user.planExpiry,
    hasCustomKey: !!(user.customProvider),
    customProvider: user.customProvider,
    customModel: user.customModel,
  });
}
