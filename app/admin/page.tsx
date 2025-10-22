import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "@/components/admin/admin-dashboard"

export default async function AdminPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

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
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "user"),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase
      .from("transactions")
      .select("waste_type, points_earned, created_at")
      .order("created_at", { ascending: true }),
    supabase.from("waste_bins").select("waste_type, capacity_percentage, needs_attention, waste_stations(name)"),
    supabase
      .from("redemptions")
      .select("*, profiles(full_name, email), products(name)")
      .order("created_at", { ascending: false })
      .limit(10),
  ])

  // Calculate total points redeemed
  const { data: redemptions } = await supabase.from("redemptions").select("points_spent")
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
