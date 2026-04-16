import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await apiClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/auth/login")
  }

  // Get analytics data
  const [
    { count: totalUsers },
    { count: totalTransactions },
    { data: transactions },
    { data: wasteBins },
    { data: recentRedemptions },
  ] = await Promise.all([
    apiClient.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    apiClient.from("transactions").select("*", { count: "exact", head: true }),
    apiClient
      .from("transactions")
      .select("waste_type, points_earned, created_at")
      .order("created_at", { ascending: true }),
    apiClient.from("waste_bins").select("waste_type, capacity_percentage, current_weight, needs_attention, waste_stations(name)"),
    apiClient
      .from("redemptions")
      .select("*, profiles(full_name, email), products(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // Calculate total points redeemed
  const { data: redemptions } = await apiClient.from("redemptions").select("points_spent")
  const totalPointsRedeemed = redemptions?.reduce((sum, r) => sum + r.points_spent, 0) || 0

  return (
    <AdminDashboard
      profile={profile}
      stats={{
        totalUsers: totalUsers || 0,
        totalTransactions: totalTransactions || 0,
        totalPointsRedeemed,
      }}
      transactions={transactions || []}
      wasteBins={wasteBins || []}
      recentRedemptions={recentRedemptions || []}
    />
  )
}
