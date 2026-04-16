import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"
import { StoreView } from "@/components/user/store-view"

export default async function StorePage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await apiClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "user") {
    redirect("/auth/login")
  }

  // Get available products
  const { data: products } = await apiClient
    .from("products")
    .select("*")
    .eq("is_available", true)
    .order("category", { ascending: true })
    .order("points_cost", { ascending: true })

  // Get user's redemptions
  const { data: redemptions } = await apiClient
    .from("redemptions")
    .select(
      `
      *,
      products (
        name,
        image_url
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  return <StoreView profile={profile} products={products || []} redemptions={redemptions || []} />
}
