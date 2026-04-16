import { cookies } from "next/headers"
import { getTokenCookieName } from "@/lib/api/token"

export async function getServerTokenFromCookies() {
  const store = await cookies()
  return store.get(getTokenCookieName())?.value ?? null
}
