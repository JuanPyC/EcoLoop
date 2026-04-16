import { ApiClientCore } from "@/lib/api/client-core"
import { getServerTokenFromCookies } from "@/lib/api/token-server"

export async function createClient() {
	return new ApiClientCore("server", getServerTokenFromCookies)
}
