import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"
import { UserDashboard } from "@/components/user/user-dashboard"

export default async function UserPage() {
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

  // Get recent transactions
  const { data: transactions } = await apiClient
    .from("transactions")
    .select(
      `
      *,
      waste_bins (
        waste_type,
        waste_stations (
          name,
          location
        )
      )
    `,
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10)

  return <UserDashboard profile={profile} transactions={transactions || []} />
}
