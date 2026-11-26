import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import {
  getRequiredPermissions,
  hasAnyPermission,
} from "@/lib/backendAccess.mjs";

export default withAuth(
  function proxy(request) {
    const requiredPermissions = getRequiredPermissions(
      request.nextUrl.pathname,
      request.method
    );

    if (!requiredPermissions) return NextResponse.next();

    const token = request.nextauth?.token;
    if (hasAnyPermission(token, requiredPermissions)) {
      return NextResponse.next();
    }

    if (request.nextUrl.pathname.startsWith("/api/")) {
      return NextResponse.json(
        { error: token ? "Sem permissões para esta operação." : "Não autenticado." },
        { status: token ? 403 : 401 }
      );
    }

    return NextResponse.redirect(
      new URL("/backend/forbidden", request.url)
    );
  },
  {
    pages: {
      signIn: "/backend/login",
    },
    callbacks: {
      authorized({ req, token }) {
        return req.nextUrl.pathname.startsWith("/api/") || Boolean(token);
      },
    },
  }
);

export const config = {
  matcher: ["/backend/:path*", "/api/:path*"],
};