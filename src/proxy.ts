import { auth } from "@/lib/auth";

const PUBLIC_PATHS = ["/login"];

export const proxy = auth((req) => {
  const isPublic = PUBLIC_PATHS.includes(req.nextUrl.pathname);

  if (!req.auth && !isPublic) {
    const loginUrl = new URL("/login", req.nextUrl.origin);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  if (req.auth && req.nextUrl.pathname === "/login") {
    return Response.redirect(new URL("/", req.nextUrl.origin));
  }
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
