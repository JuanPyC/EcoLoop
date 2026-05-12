import { NextResponse, type NextRequest } from "next/server"
import { sessionCookieName } from "./local-client"

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get(sessionCookieName)?.value

  if (
    request.nextUrl.pathname !== "/" &&
    !session &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone()
    url.pathname = "/auth/login"
    return NextResponse.redirect(url)
  }

  return NextResponse.next({ request })
}
