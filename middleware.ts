export { default } from "next-auth/middleware";

export const config = {
  // Only protect admin routes
  matcher: ["/admin", "/admin/:path*"],
};
