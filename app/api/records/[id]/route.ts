import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/records/[id] — get one record (includes full jdContent)
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const record = await prisma.jobRecord.findFirst({
    where: { id: params.id, userId: session.user.id },
  });
  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(record);
}

// PATCH /api/records/[id] — update results
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  // Merge new result into existing results JSON
  const existing = await prisma.jobRecord.findFirst({
    where: { id: params.id, userId: session.user.id },
    select: { results: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let currentResults: Record<string, string> = {};
  try { currentResults = JSON.parse(existing.results); } catch { /* ignore */ }

  if (body.actionType && body.content) {
    currentResults[body.actionType] = body.content;
  }

  const updated = await prisma.jobRecord.update({
    where: { id: params.id },
    data: { results: JSON.stringify(currentResults) },
  });

  return NextResponse.json({ id: updated.id });
}

// DELETE /api/records/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.jobRecord.deleteMany({
    where: { id: params.id, userId: session.user.id },
  });

  return NextResponse.json({ ok: true });
}
