import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Edge Middleware: Multi-Actor Route Protection & Authorization Guard
 *
 * Actor Separation:
 * 1. Customer (Public & Authenticated):
 *    - Public: /, /products, /search, /auth/*
 *    - Protected: /cart, /checkout, /orders, /account
 * 2. Seller Portal:
 *    - /seller/* requires role 'SELLER' or 'ADMIN'
 * 3. Admin Control Plane:
 *    - /admin/* requires role 'ADMIN'
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve token and user role from cookies or headers
  const token = request.cookies.get("accessToken")?.value || request.headers.get("authorization");
  const userRole = request.cookies.get("userRole")?.value || "CUSTOMER";

  // 1. Static and internal routes pass through automatically
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 2. Identify Frontend Context (Customer vs Company Portal)
  const host = request.headers.get("host") || "";
  const isCompanyPortal =
    process.env.FRONTEND_TYPE === "company" ||
    host.includes(":3001") ||
    host.startsWith("company.");

  // If on Company Portal and visiting root '/', redirect to '/seller' or '/admin'
  if (isCompanyPortal && pathname === "/") {
    return NextResponse.redirect(new URL("/seller", request.url));
  }

  // 3. Public Storefront & Auth routes
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/products") ||
    pathname.startsWith("/search") ||
    pathname.startsWith("/auth");

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // 3. Customer Protected Routes (/checkout, /orders, /account)
  const isCustomerProtectedRoute =
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/orders") ||
    pathname.startsWith("/account");

  if (isCustomerProtectedRoute) {
    // In local dev without explicit cookie, allow graceful fallback
    if (!token && process.env.NODE_ENV === "production") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 4. Seller Portal Routes (/seller/*)
  if (pathname.startsWith("/seller")) {
    if (process.env.NODE_ENV === "production" && !token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (process.env.NODE_ENV === "production" && userRole !== "SELLER" && userRole !== "ADMIN") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "seller_required");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 5. Admin Control Plane Routes (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (process.env.NODE_ENV === "production" && !token) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (process.env.NODE_ENV === "production" && userRole !== "ADMIN") {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("error", "admin_required");
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
