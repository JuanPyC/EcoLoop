import { getApiBaseUrl } from "@/lib/api/config"
import {
  clearBrowserSession,
  getBrowserToken,
  getBrowserUser,
  saveBrowserSession,
  type AuthUser,
} from "@/lib/api/token"

type ErrorPayload = { message: string }

type QueryResponse<T = any> = {
  data: T | null
  error: ErrorPayload | null
  count?: number | null
}

type Filter = {
  field: string
  value: unknown
}

type QueryAction = "select" | "insert" | "update" | "delete"

type SelectOptions = {
  count?: "exact"
  head?: boolean
}

type QuerySpec = {
  table: string
  action: QueryAction
  columns?: string
  options?: SelectOptions
  filters: Filter[]
  orders: Array<{ field: string; ascending: boolean }>
  limitValue?: number
  payload?: any
  single?: boolean
}

type AuthResponse = {
  accessToken: string
  user: {
    id: string
    email: string
    fullName?: string
    full_name?: string
    role: string
    ecoPoints?: number
    eco_points?: number
  }
}

function normalizeUser(user: AuthResponse["user"]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name ?? user.fullName ?? null,
    role: user.role,
    eco_points: user.eco_points ?? user.ecoPoints ?? 0,
  }
}

function normalizeError(error: unknown, fallback: string): ErrorPayload {
  if (error instanceof Error) {
    return { message: error.message }
  }

  return { message: fallback }
}

function applyFilters<T extends Record<string, any>>(rows: T[], filters: Filter[]) {
  let result = rows

  for (const filter of filters) {
    result = result.filter((row) => {
      if (filter.field.includes(".")) {
        const [first, second] = filter.field.split(".")
        return row?.[first]?.[second] === filter.value
      }
      return row?.[filter.field] === filter.value
    })
  }

  return result
}

function applyOrder<T extends Record<string, any>>(rows: T[], orders: Array<{ field: string; ascending: boolean }>) {
  if (!orders.length) return rows

  const result = [...rows]
  for (const order of orders.reverse()) {
    result.sort((a, b) => {
      const av = a?.[order.field]
      const bv = b?.[order.field]
      if (av == null && bv == null) return 0
      if (av == null) return 1
      if (bv == null) return -1
      if (av === bv) return 0
      return order.ascending ? (av > bv ? 1 : -1) : av > bv ? -1 : 1
    })
  }

  return result
}

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<{ data: T | null; error: ErrorPayload | null; status?: number }> {
  try {
    const response = await fetch(`${getApiBaseUrl()}/api${path}`, {
      cache: "no-store",
      ...init,
      headers: {
        ...(init?.body ? { "content-type": "application/json" } : {}),
        ...(init?.headers ?? {}),
      },
    })

    const body = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        data: null,
        error: {
          message: body?.error || `Error HTTP ${response.status}`,
        },
        status: response.status,
      }
    }

    return { data: body as T, error: null, status: response.status }
  } catch (error) {
    return {
      data: null,
      error: normalizeError(error, "No se pudo conectar con el backend"),
    }
  }
}

class QueryBuilder {
  private action: QueryAction = "select"
  private columns = "*"
  private options: SelectOptions | undefined
  private filters: Filter[] = []
  private orders: Array<{ field: string; ascending: boolean }> = []
  private limitValue: number | undefined
  private payload: any
  private singleRow = false

  constructor(private readonly client: ApiClientCore, private readonly table: string) {}

  select(columns = "*", options?: SelectOptions) {
    this.action = "select"
    this.columns = columns
    this.options = options
    return this
  }

  insert(payload: any) {
    this.action = "insert"
    this.payload = payload
    return this
  }

  update(payload: any) {
    this.action = "update"
    this.payload = payload
    return this
  }

  delete() {
    this.action = "delete"
    return this
  }

  eq(field: string, value: unknown) {
    this.filters.push({ field, value })
    return this
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orders.push({ field, ascending: options?.ascending ?? true })
    return this
  }

  limit(value: number) {
    this.limitValue = value
    return this
  }

  async single() {
    this.singleRow = true
    return this.execute()
  }

  then<TResult1 = QueryResponse<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResponse<any>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  private async execute(): Promise<QueryResponse<any>> {
    const result = await this.client.executeQuery({
      table: this.table,
      action: this.action,
      columns: this.columns,
      options: this.options,
      filters: this.filters,
      orders: this.orders,
      limitValue: this.limitValue,
      payload: this.payload,
      single: this.singleRow,
    })

    if (!result.error && this.singleRow) {
      if (Array.isArray(result.data)) {
        return { ...result, data: result.data[0] ?? null }
      }
    }

    return result
  }
}

export class ApiClientCore {
  auth = {
    signInWithPassword: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await requestJson<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      })

      if (error || !data) {
        return { data: null, error: error ?? { message: "No se pudo iniciar sesion" } }
      }

      const normalizedUser = normalizeUser(data.user)
      saveBrowserSession(data.accessToken, normalizedUser)
      return { data: { user: normalizedUser }, error: null }
    },

    signUp: async ({
      email,
      password,
      options,
    }: {
      email: string
      password: string
      options?: { data?: { full_name?: string; role?: string } }
    }) => {
      const { data, error } = await requestJson<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          fullName: options?.data?.full_name ?? email.split("@")[0],
          role: options?.data?.role ?? "user",
        }),
      })

      if (error || !data) {
        return { data: null, error: error ?? { message: "No se pudo registrar el usuario" } }
      }

      const normalizedUser = normalizeUser(data.user)
      saveBrowserSession(data.accessToken, normalizedUser)
      return { data: { user: normalizedUser }, error: null }
    },

    getUser: async () => {
      const token = await this.getToken()

      if (!token) {
        const browserUser = getBrowserUser()
        if (browserUser) {
          return { data: { user: browserUser }, error: null }
        }

        return { data: { user: null }, error: null }
      }

      const { data, error } = await requestJson<{ user: any }>("/auth/me", {
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      if (error || !data?.user) {
        return { data: { user: null }, error: error ?? null }
      }

      return { data: { user: data.user }, error: null }
    },

    signOut: async () => {
      clearBrowserSession()
      return { error: null }
    },
  }

  from(table: string) {
    return new QueryBuilder(this, table)
  }

  private async getToken() {
    if (this.mode === "browser") {
      return getBrowserToken()
    }

    if (this.serverTokenResolver) {
      return this.serverTokenResolver()
    }

    return null
  }

  constructor(
    private readonly mode: "browser" | "server",
    private readonly serverTokenResolver?: () => Promise<string | null>,
  ) {}

  async executeQuery(spec: QuerySpec): Promise<QueryResponse<any>> {
    const token = await this.getToken()

    if (spec.action === "select") {
      return this.handleSelect(spec, token)
    }

    if (spec.action === "insert") {
      return this.handleInsert(spec, token)
    }

    if (spec.action === "update") {
      return this.handleUpdate(spec, token)
    }

    return this.handleDelete(spec, token)
  }

  private async handleSelect(spec: QuerySpec, token: string | null): Promise<QueryResponse<any>> {
    switch (spec.table) {
      case "profiles": {
        if (spec.options?.head && spec.options.count === "exact") {
          const users = await this.selectUsers(token)
          if (users.error) return { data: null, error: users.error, count: 0 }

          const filteredUsers = applyFilters(users.data ?? [], spec.filters)
          return { data: null, error: null, count: filteredUsers.length }
        }

        const hasIdFilter = spec.filters.some((f) => f.field === "id")
        if (hasIdFilter) {
          const me = await this.auth.getUser()
          if (me.error || !me.data.user) {
            return { data: spec.single ? null : [], error: me.error }
          }

          const filtered = applyFilters([me.data.user], spec.filters)
          if (spec.single) {
            return { data: filtered[0] ?? null, error: null }
          }
          return { data: filtered, error: null }
        }

        const users = await this.selectUsers(token)
        if (users.error) return { data: spec.single ? null : [], error: users.error }

        let rows = applyFilters(users.data ?? [], spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: spec.single ? (rows[0] ?? null) : rows, error: null }
      }

      case "transactions": {
        const userFilter = spec.filters.find((f) => f.field === "user_id")

        const data = userFilter
          ? await requestJson<{ transactions: any[] }>("/profiles/me/transactions", {
              headers: token ? { authorization: `Bearer ${token}` } : undefined,
            })
          : await requestJson<{ transactions: any[] }>("/transactions", {
              headers: token ? { authorization: `Bearer ${token}` } : undefined,
            })

        if (data.error || !data.data) {
          return { data: spec.options?.head ? null : [], error: data.error, count: 0 }
        }

        let rows = applyFilters(data.data.transactions, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        if (spec.options?.head && spec.options.count === "exact") {
          return { data: null, error: null, count: rows.length }
        }

        return { data: rows, error: null }
      }

      case "waste_stations": {
        const result = await requestJson<{ stations: any[] }>("/stations")
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.stations, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: rows, error: null }
      }

      case "waste_bins": {
        const qrFilter = spec.filters.find((f) => f.field === "qr_code")
        if (qrFilter) {
          const result = await requestJson<{ bin: any }>(`/stations/bins/qr/${encodeURIComponent(String(qrFilter.value))}`)
          if (result.error || !result.data) return { data: spec.single ? null : [], error: result.error }
          return { data: spec.single ? result.data.bin : [result.data.bin], error: null }
        }

        const stations = await requestJson<{ stations: any[] }>("/stations")
        if (stations.error || !stations.data) return { data: [], error: stations.error }

        const rows = stations.data.stations.flatMap((station) =>
          (station.waste_bins || []).map((bin: any) => ({
            ...bin,
            waste_stations: {
              name: station.name,
              location: station.location,
            },
          })),
        )

        let filtered = applyFilters(rows, spec.filters)
        filtered = applyOrder(filtered, spec.orders)
        if (spec.limitValue != null) filtered = filtered.slice(0, spec.limitValue)

        if (spec.options?.head && spec.options.count === "exact") {
          return { data: null, error: null, count: filtered.length }
        }

        return { data: filtered, error: null }
      }

      case "products": {
        const needsAll = !spec.filters.some((f) => f.field === "is_available" && f.value === true)
        const path = needsAll ? "/products?all=1" : "/products"
        const result = await requestJson<{ products: any[] }>(path, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        })
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.products, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: rows, error: null }
      }

      case "redemptions": {
        const hasUserFilter = spec.filters.some((f) => f.field === "user_id")
        const path = hasUserFilter ? "/redemptions/mine" : "/redemptions"
        const result = await requestJson<{ redemptions: any[] }>(path, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        })
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.redemptions, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: rows, error: null }
      }

      case "news_articles": {
        const publishedFilter = spec.filters.find((f) => f.field === "published")
        const path = publishedFilter?.value === true ? "/news" : "/news?all=1"
        const result = await requestJson<{ articles: any[] }>(path, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        })
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.articles, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: rows, error: null }
      }

      case "quizzes": {
        const isActiveFilter = spec.filters.find((f) => f.field === "is_active")
        const path = isActiveFilter?.value === true ? "/quizzes" : "/quizzes?all=1"
        const result = await requestJson<{ quizzes: any[] }>(path, {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        })
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.quizzes, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: spec.single ? (rows[0] ?? null) : rows, error: null }
      }

      case "quiz_questions": {
        const quizFilter = spec.filters.find((f) => f.field === "quiz_id")
        if (!quizFilter) {
          return { data: [], error: { message: "Falta filtro quiz_id" } }
        }

        const result = await requestJson<{ questions: any[] }>(`/quizzes/${quizFilter.value}/questions`)
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.questions, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: rows, error: null }
      }

      case "quiz_completions": {
        const result = await requestJson<{ completions: any[] }>("/quizzes/completions/mine", {
          headers: token ? { authorization: `Bearer ${token}` } : undefined,
        })
        if (result.error || !result.data) return { data: [], error: result.error }

        let rows = applyFilters(result.data.completions, spec.filters)
        rows = applyOrder(rows, spec.orders)
        if (spec.limitValue != null) rows = rows.slice(0, spec.limitValue)

        return { data: spec.single ? (rows[0] ?? null) : rows, error: null }
      }

      default:
        return { data: spec.single ? null : [], error: { message: `Tabla no soportada: ${spec.table}` } }
    }
  }

  private async handleInsert(spec: QuerySpec, token: string | null): Promise<QueryResponse<any>> {
    const authHeaders = token ? { authorization: `Bearer ${token}` } : undefined

    switch (spec.table) {
      case "waste_stations": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ station: any }>("/stations", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(row),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.station], error: null }
      }

      case "waste_bins": {
        const payload = Array.isArray(spec.payload) ? spec.payload : [spec.payload]
        const result = await requestJson<{ bins: any[] }>("/stations/bins", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(payload),
        })
        return result.error ? { data: null, error: result.error } : { data: result.data?.bins ?? [], error: null }
      }

      case "products": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ product: any }>("/products", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(row),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.product], error: null }
      }

      case "redemptions": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ redemption: any }>("/redemptions", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ productId: row.product_id, quantity: row.quantity ?? 1 }),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.redemption], error: null }
      }

      case "news_articles": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ article: any }>("/news", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(row),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.article], error: null }
      }

      case "quizzes": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ quiz: any }>("/quizzes", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(row),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.quiz], error: null }
      }

      case "quiz_questions": {
        const payload = Array.isArray(spec.payload) ? spec.payload : [spec.payload]
        const quizId = payload[0]?.quiz_id
        if (!quizId) return { data: null, error: { message: "Falta quiz_id en preguntas" } }

        const questions = payload.map((q) => ({
          question: q.question,
          correct_answer: q.correct_answer,
          wrong_answer_1: q.wrong_answer_1,
          wrong_answer_2: q.wrong_answer_2,
          wrong_answer_3: q.wrong_answer_3,
          order_index: q.order_index,
        }))

        const result = await requestJson<{ questions: any[] }>(`/quizzes/${quizId}/questions`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify(questions),
        })

        return result.error ? { data: null, error: result.error } : { data: result.data?.questions ?? [], error: null }
      }

      case "quiz_completions": {
        const row = Array.isArray(spec.payload) ? spec.payload[0] : spec.payload
        const result = await requestJson<{ completion: any }>("/quizzes/completions", {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            quizId: row.quiz_id,
            score: row.score,
            pointsEarned: row.points_earned,
          }),
        })

        return result.error ? { data: null, error: result.error } : { data: [result.data?.completion], error: null }
      }

      default:
        return { data: null, error: { message: `Insert no soportado para ${spec.table}` } }
    }
  }

  private async handleUpdate(spec: QuerySpec, token: string | null): Promise<QueryResponse<any>> {
    const authHeaders = token ? { authorization: `Bearer ${token}` } : undefined
    const idFilter = spec.filters.find((f) => f.field === "id")

    switch (spec.table) {
      case "products": {
        if (!idFilter) return { data: null, error: { message: "Falta filtro id" } }
        const result = await requestJson<{ product: any }>(`/products/${idFilter.value}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(spec.payload),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.product], error: null }
      }

      case "waste_stations": {
        if (!idFilter) return { data: null, error: { message: "Falta filtro id" } }
        const result = await requestJson<{ station: any }>(`/stations/${idFilter.value}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(spec.payload),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.station], error: null }
      }

      case "waste_bins": {
        if (!idFilter) return { data: null, error: { message: "Falta filtro id" } }
        const result = await requestJson<{ bin: any }>(`/stations/bins/${idFilter.value}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(spec.payload),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.bin], error: null }
      }

      case "profiles": {
        if (!idFilter) return { data: null, error: { message: "Falta filtro id" } }
        const result = await requestJson<{ user: any }>(`/users/${idFilter.value}`, {
          method: "PATCH",
          headers: authHeaders,
          body: JSON.stringify(spec.payload),
        })
        return result.error ? { data: null, error: result.error } : { data: [result.data?.user], error: null }
      }

      default:
        return { data: null, error: { message: `Update no soportado para ${spec.table}` } }
    }
  }

  private async handleDelete(spec: QuerySpec, token: string | null): Promise<QueryResponse<any>> {
    const authHeaders = token ? { authorization: `Bearer ${token}` } : undefined
    const idFilter = spec.filters.find((f) => f.field === "id")

    if (!idFilter) {
      return { data: null, error: { message: "Falta filtro id para eliminar" } }
    }

    const pathByTable: Record<string, string> = {
      products: `/products/${idFilter.value}`,
      waste_stations: `/stations/${idFilter.value}`,
      profiles: `/users/${idFilter.value}`,
      news_articles: `/news/${idFilter.value}`,
      quizzes: `/quizzes/${idFilter.value}`,
    }

    const path = pathByTable[spec.table]
    if (!path) {
      return { data: null, error: { message: `Delete no soportado para ${spec.table}` } }
    }

    const result = await requestJson<{ ok: boolean }>(path, {
      method: "DELETE",
      headers: authHeaders,
    })

    return result.error ? { data: null, error: result.error } : { data: null, error: null }
  }

  private async selectUsers(token: string | null) {
    if (!token) {
      const me = await this.auth.getUser()
      if (!me.data.user) return { data: [], error: null as ErrorPayload | null }
      return { data: [me.data.user], error: null as ErrorPayload | null }
    }

    const users = await requestJson<{ users: any[] }>("/users", {
      headers: { authorization: `Bearer ${token}` },
    })

    if (!users.error && users.data) {
      return { data: users.data.users, error: null as ErrorPayload | null }
    }

    const me = await this.auth.getUser()
    if (!me.data.user) return { data: [], error: users.error }
    return { data: [me.data.user], error: null as ErrorPayload | null }
  }
}
