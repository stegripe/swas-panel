import { NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;

    const protectedPaths = ["/dashboard", "/api/data", "/api/create", "/api/update", "/api/delete"];
    const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));

    if (isProtected && !token) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (isProtected && token) {
        const verifiedToken = await verifyJwtToken(token).catch(() => {
            return NextResponse.redirect(new URL("/", req.url));
        });

        if (!verifiedToken) {
            return NextResponse.redirect(new URL("/", req.url));
        }
    }

    return NextResponse.next();
}
