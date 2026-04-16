const TOKEN_COOKIE = "ecoloop_token"
const USER_STORAGE_KEY = "ecoloop_user"

export const tokenCookieName = TOKEN_COOKIE

export type AuthUser = {
  id: string
  email: string
  full_name: string | null
  role: string
  eco_points?: number
}

export function saveBrowserSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return

  localStorage.setItem(TOKEN_COOKIE, token)
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
  document.cookie = `${TOKEN_COOKIE}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`
}

export function clearBrowserSession() {
  if (typeof window === "undefined") return

  localStorage.removeItem(TOKEN_COOKIE)
  localStorage.removeItem(USER_STORAGE_KEY)
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`
}

export function getBrowserToken() {
  if (typeof window === "undefined") return null

  const cookieToken = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${TOKEN_COOKIE}=`))
    ?.split("=")[1]

  return cookieToken || localStorage.getItem(TOKEN_COOKIE)
}

export function getBrowserUser(): AuthUser | null {
  if (typeof window === "undefined") return null

  const raw = localStorage.getItem(USER_STORAGE_KEY)
  if (!raw) return null

  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getTokenCookieName() {
  return TOKEN_COOKIE
}
