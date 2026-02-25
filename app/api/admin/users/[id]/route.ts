import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions, ADMIN_EMAIL } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Protect the super admin account from deletion
  const target = await prisma.user.findUnique({ where: { id: params.id }, select: { email: true } });
  if (target?.email === ADMIN_EMAIL) return NextResponse.json({ error: "Cannot delete super admin" }, { status: 400 });

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
