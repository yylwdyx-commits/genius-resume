import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UserApiConfig, AIProvider } from "@/lib/aiClient";

const PRO_ACTIONS = ["job-intel", "interview-questions", "mock-interview", "chat"];
export const FREE_LIMIT = 3; // monthly optimize-resume calls

type AllowedResult = {
  allowed: true;
  userId: string;
  userConfig: UserApiConfig | null;
};
type DeniedResult = {
  allowed: false;
  reason: "unauthenticated" | "pro_required" | "limit_reached";
};

export type AccessResult = AllowedResult | DeniedResult;

export async function checkAccess(action: string): Promise<AccessResult> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { allowed: false, reason: "unauthenticated" };
  }

  const userId = session.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      plan: true,
      usageCount: true,
      usageResetAt: true,
      customProvider: true,
      customApiKey: true,
      customModel: true,
    },
  });

  if (!user) return { allowed: false, reason: "unauthenticated" };

  // BYOK: user brings their own key → bypass all limits, access all features
  if (user.customProvider && user.customApiKey) {
    return {
      allowed: true,
      userId,
      userConfig: {
        provider: user.customProvider as AIProvider,
        apiKey: user.customApiKey,
        model: user.customModel ?? undefined,
      },
    };
  }

  // Pro plan: full access
  if (user.plan === "pro") {
    return { allowed: true, userId, userConfig: null };
  }

  // Free plan: Pro-only features blocked
  if (PRO_ACTIONS.includes(action)) {
    return { allowed: false, reason: "pro_required" };
  }

  // Free plan: usage limit for optimize-resume
  if (action === "optimize-resume") {
    const now = new Date();
    const resetAt = new Date(user.usageResetAt);
    const isNewMonth =
      now.getFullYear() !== resetAt.getFullYear() ||
      now.getMonth() !== resetAt.getMonth();

    if (isNewMonth) {
      // Reset counter for new month
      await prisma.user.update({
        where: { id: userId },
        data: { usageCount: 1, usageResetAt: now },
      });
      return { allowed: true, userId, userConfig: null };
    }

    if (user.usageCount >= FREE_LIMIT) {
      return { allowed: false, reason: "limit_reached" };
    }

    await prisma.user.update({
      where: { id: userId },
      data: { usageCount: { increment: 1 } },
    });

    return { allowed: true, userId, userConfig: null };
  }

  // All other free actions
  return { allowed: true, userId, userConfig: null };
}
