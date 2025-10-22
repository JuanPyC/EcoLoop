import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { WorkerDashboard } from "@/components/worker/worker-dashboard"

export default async function WorkerPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "worker" && profile.role !== "admin")) {
    redirect("/auth/login")
  }

  // Get all waste stations with their bins
  const { data: stations } = await supabase
    .from("waste_stations")
    .select(
      `
      *,
      waste_bins (
        *
      )
    `,
    )
    .order("name", { ascending: true })

  return <WorkerDashboard profile={profile} stations={stations || []} />
}
