import { type NextRequest, NextResponse } from "next/server";
import { verifyJwtToken } from "./lib/auth";

export async function middleware(req: NextRequest) {
    const token = req.cookies.get("token")?.value;

    const protectedPaths = ["/dashboard", "/api/data", "/api/create", "/api/update", "/api/delete"];
    const apiPaths = ["/api/esp/users", "/api/esp/attendances"];
    const isProtected = protectedPaths.some((path) => req.nextUrl.pathname.startsWith(path));
    const isApi = apiPaths.some((path) => req.nextUrl.pathname.startsWith(path));

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

    const Authorization = req.headers.get("Authorization");

    if (isApi && !Authorization) {
        return NextResponse.redirect(new URL("/", req.url));
    }

    if (isApi && Authorization) {
        const apiToken = process.env.API_TOKEN;
        if (!apiToken) {
            console.error("API token is not set in environment variables");
            return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
        }
        const verifiedToken = process.env.API_TOKEN === Authorization;

        if (!verifiedToken) {
            console.log("API token is invalid");
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }
    }

    return NextResponse.next();
}
