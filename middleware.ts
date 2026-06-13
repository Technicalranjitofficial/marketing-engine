import { NextRequest, NextResponse } from "next/server";

// Public paths that don't require auth
const PUBLIC_PATHS = [
  "/login",
  "/api/auth/login",
  "/api/auth/logout",
  "/api/unsubscribe",
  "/api/track",
  "/api/webhook",
  "/api/health",
  "/unsubscribe",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie
  const session = request.cookies.get("marketing_session");

  if (!session?.value) {
    // Redirect to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session (basic check - contains expected format)
  try {
    const decoded = Buffer.from(session.value, "base64").toString();
    if (!decoded.startsWith("admin:")) {
      throw new Error("Invalid session");
    }
  } catch {
    // Invalid session, redirect to login
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.delete("marketing_session");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
