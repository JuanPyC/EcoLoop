import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"
import { WorkerDashboard } from "@/components/worker/worker-dashboard"

export default async function WorkerPage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await apiClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || (profile.role !== "worker" && profile.role !== "admin")) {
    redirect("/auth/login")
  }

  // Get all waste stations with their bins
  const { data: stations } = await apiClient
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
