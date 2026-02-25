export { default } from "next-auth/middleware";

export const config = {
  // Protect all routes except auth-related and static assets
  matcher: ["/((?!api/auth|login|_next/static|_next/image|favicon.ico).*)"],
};
