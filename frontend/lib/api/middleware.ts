import { NextResponse, type NextRequest } from "next/server"
import { tokenCookieName } from "@/lib/api/token"

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  const isPublic =
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico"

  if (isPublic) {
    return NextResponse.next()
  }

  const token = request.cookies.get(tokenCookieName)?.value

  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}
