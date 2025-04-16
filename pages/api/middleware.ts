import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "../../lib/auth";

export function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;
    const isProtected = req.nextUrl.pathname.startsWith("/dashboard");

    if (isProtected) {
        if (!token) {
            return NextResponse.redirect(new URL("/login", req.url));
        }

        const valid = verifyToken(token);
        if (!valid) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard"],
};
