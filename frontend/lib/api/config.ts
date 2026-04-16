export function getApiBaseUrl() {
  if (typeof window === "undefined") {
    return process.env.API_SERVER_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
  }

  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
}
