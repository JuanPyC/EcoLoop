import { createClient } from "@/lib/api/server"
import { redirect } from "next/navigation"
import { StationsManagement } from "@/components/admin/stations-management"

export default async function StationsPage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await apiClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  const { data: stations } = await apiClient
    .from("waste_stations")
    .select("*, waste_bins(*)")
    .order("created_at", { ascending: false })

  return <StationsManagement profile={profile} stations={stations || []} />
}
