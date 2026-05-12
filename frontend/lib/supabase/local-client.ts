type Session = {
  id: string
  email: string
  full_name?: string | null
  role: string
  eco_points?: number
  token?: string
}

type QueryResult<T> = Promise<{ data: T | null; error: Error | null; count?: number | null }>

type ClientOptions = {
  getSession: () => Session | null
  setSession: (session: Session | null) => void
  baseUrl: string
}

const SESSION_KEY = "ecoloop_session"

const encodeSession = (session: Session) => encodeURIComponent(JSON.stringify(session))
const decodeSession = (value: string) => {
  try {
    return JSON.parse(decodeURIComponent(value)) as Session
  } catch {
    return null
  }
}

const parseCookie = (cookieHeader: string | null | undefined, key: string) => {
  if (!cookieHeader) return null
  const match = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith(`${key}=`))
  if (!match) return null
  return match.slice(key.length + 1)
}

const tablePath = (table: string) => `/api/local/${table}`

const getHeaders = (session?: Session | null) => {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (session?.token) {
    headers["Authorization"] = `Bearer ${session.token}`
  }
  return headers
}

class LocalQueryBuilder<T = any> {
  private filters: Array<{ column: string; value: string }> = []
  private sort?: { column: string; ascending: boolean }
  private take?: number
  private head = false
  private singleResult = false

  constructor(
    private readonly options: ClientOptions,
    private readonly table: string,
  ) {}

  select(_columns = "*", options?: { count?: "exact"; head?: boolean }) {
    this.head = options?.head ?? false
    return this
  }

  eq(column: string, value: string) {
    this.filters.push({ column, value })
    return this
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.sort = { column, ascending: options?.ascending ?? true }
    return this
  }

  limit(value: number) {
    this.take = value
    return this
  }

  single() {
    this.singleResult = true
    return this.execute()
  }

  then<TResult1 = { data: T | null; error: Error | null; count?: number | null }, TResult2 = never>(
    onfulfilled?: ((value: { data: T | null; error: Error | null; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ) {
    return this.execute().then(onfulfilled, onrejected)
  }

  private async execute(): Promise<{ data: T | null; error: Error | null; count?: number | null }> {
    try {
      const search = new URLSearchParams()
      this.filters.forEach(({ column, value }) => search.set(`eq_${column}`, value))
      if (this.sort) {
        search.set("order", this.sort.column)
        search.set("ascending", String(this.sort.ascending))
      }
      if (typeof this.take === "number") search.set("limit", String(this.take))
      if (this.head) search.set("head", "true")

      const session = this.options.getSession()
      const response = await fetch(`${this.options.baseUrl}${tablePath(this.table)}${search.toString() ? `?${search.toString()}` : ""}`, {
        headers: getHeaders(session),
      })
      const payload = await response.json().catch(() => null)

      if (!response.ok) {
        return { data: null, error: new Error(payload?.error || "Error al consultar datos") }
      }

      if (this.head) {
        return { data: null, error: null, count: payload?.count ?? 0 }
      }

      const data = this.singleResult ? (Array.isArray(payload) ? payload[0] ?? null : payload ?? null) : payload
      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
    }
  }

  async insert(values: any) {
    return runMutation(this.options, this.table, "POST", values)
  }

  async update(values: any) {
    const idFilter = this.filters.find((filter) => filter.column === "id")
    if (!idFilter) return { data: null, error: new Error("Se requiere filtro id para actualizar") }
    return runMutation(this.options, this.table, "PUT", values, idFilter.value)
  }

  async delete() {
    const idFilter = this.filters.find((filter) => filter.column === "id")
    if (!idFilter) return { data: null, error: new Error("Se requiere filtro id para eliminar") }
    return runMutation(this.options, this.table, "DELETE", null, idFilter.value)
  }
}

async function runMutation(options: ClientOptions, table: string, method: "POST" | "PUT" | "DELETE", payload: any, id?: string) {
  try {
    const session = options.getSession()
    const path = id ? `${tablePath(table)}/${id}` : tablePath(table)
    const response = await fetch(`${options.baseUrl}${path}`, {
      method,
      headers: getHeaders(session),
      body: method === "DELETE" ? undefined : JSON.stringify(payload),
    })
    const responsePayload = await response.json().catch(() => null)
    if (!response.ok && response.status !== 204) {
      return { data: null, error: new Error(responsePayload?.error || "Operación fallida") }
    }
    if (response.status === 204) return { data: null, error: null }
    return { data: responsePayload, error: null }
  } catch (error: any) {
    return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
  }
}

export function createLocalClient(options: ClientOptions) {
  return {
    auth: {
      async signInWithPassword({ email, password }: { email: string; password: string }) {
        try {
          const response = await fetch(`${options.baseUrl}/api/auth/login`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({ email, password }),
          })
          const payload = await response.json().catch(() => null)
          if (!response.ok) return { data: null, error: new Error(payload?.error || "Error al iniciar sesión") }
          
          const sessionWithToken = { ...payload.user, token: payload.token }
          options.setSession(sessionWithToken)
          return { data: { user: sessionWithToken }, error: null }
        } catch (error: any) {
          return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
        }
      },
      async signUp({ email, password, options: signupOptions }: { email: string; password: string; options?: { data?: { full_name?: string; role?: string } } }) {
        try {
          const response = await fetch(`${options.baseUrl}/api/auth/register`, {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              email,
              password,
              full_name: signupOptions?.data?.full_name,
              role: signupOptions?.data?.role,
            }),
          })
          const payload = await response.json().catch(() => null)
          if (!response.ok) return { data: null, error: new Error(payload?.error || "Error al registrarse") }
          
          const sessionWithToken = { ...payload.user, token: payload.token }
          options.setSession(sessionWithToken)
          return { data: { user: sessionWithToken }, error: null }
        } catch (error: any) {
          return { data: null, error: error instanceof Error ? error : new Error(String(error)) }
        }
      },
      async getUser() {
        const user = options.getSession()
        return { data: { user } }
      },
      async signOut() {
        options.setSession(null)
        return { error: null }
      },
    },
    from<T = any>(table: string) {
      return new LocalQueryBuilder<T>(options, table)
    },
  }
}

export function createBrowserSessionHelpers() {
  return {
    getSession() {
      if (typeof window === "undefined") return null
      const stored = window.localStorage.getItem(SESSION_KEY)
      if (stored) {
        try {
          return JSON.parse(stored) as Session
        } catch {
          window.localStorage.removeItem(SESSION_KEY)
        }
      }
      return decodeSession(parseCookie(document.cookie, SESSION_KEY) ?? "")
    },
    setSession(session: Session | null) {
      if (typeof window === "undefined") return
      if (session) {
        window.localStorage.setItem(SESSION_KEY, JSON.stringify(session))
        document.cookie = `${SESSION_KEY}=${encodeSession(session)}; path=/; max-age=${60 * 60 * 24 * 7}`
      } else {
        window.localStorage.removeItem(SESSION_KEY)
        document.cookie = `${SESSION_KEY}=; path=/; max-age=0`
      }
    },
  }
}

export function createServerSessionHelpers(cookieValue: string | undefined | null) {
  return {
    getSession() {
      return cookieValue ? decodeSession(cookieValue) : null
    },
    setSession() {
      return undefined
    },
  }
}

export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    // Server side: use internal docker network
    return process.env.API_URL || "http://backend:3001"
  }
  // Client side: use baked-in NEXT_PUBLIC_API_URL or fallback
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
}

export const sessionCookieName = SESSION_KEY
