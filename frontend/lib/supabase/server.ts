import { cookies } from "next/headers"
import { createLocalClient, createServerSessionHelpers, getApiBaseUrl, sessionCookieName } from "./local-client"

export async function createClient() {
  const cookieStore = await cookies()
  const rawCookie = cookieStore.get(sessionCookieName)?.value ?? null
  const { getSession } = createServerSessionHelpers(rawCookie)

  return createLocalClient({
    getSession,
    setSession: () => undefined,
    baseUrl: getApiBaseUrl(),
  })
}
