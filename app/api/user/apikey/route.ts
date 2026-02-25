import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { customProvider: true, customModel: true, customApiKey: true },
  });

  return NextResponse.json({
    provider: user?.customProvider ?? null,
    model: user?.customModel ?? null,
    // Return masked key hint so user knows one is set (never send full key back)
    hasKey: !!(user?.customApiKey),
    keyHint: user?.customApiKey ? `${user.customApiKey.slice(0, 8)}…` : null,
  });
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, apiKey, model } = await req.json();

  if (!provider || !apiKey) {
    return NextResponse.json({ error: "provider and apiKey are required" }, { status: 400 });
  }

  const validProviders = ["anthropic", "openai", "gemini", "deepseek"];
  if (!validProviders.includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      customProvider: provider,
      customApiKey: apiKey,
      customModel: model || null,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.user.update({
    where: { id: session.user.id },
    data: { customProvider: null, customApiKey: null, customModel: null },
  });

  return NextResponse.json({ success: true });
}
