import { ApiClientCore } from "@/lib/api/client-core"

export function createClient() {
  return new ApiClientCore("browser")
}
