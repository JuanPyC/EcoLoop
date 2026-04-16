import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { UserDashboard } from "@/components/user/user-dashboard"

export default async function UserPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "user") {
    redirect("/auth/login")
  }

  // Get recent transactions
  const { data: transactions } = await supabase
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
