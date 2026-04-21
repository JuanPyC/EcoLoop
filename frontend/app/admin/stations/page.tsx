import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { StationsManagement } from "@/components/admin/stations-management"

export default async function StationsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "admin") {
    redirect("/")
  }

  const { data: stations } = await supabase
    .from("waste_stations")
    .select("*, waste_bins(*)")
    .order("created_at", { ascending: false })

  return <StationsManagement profile={profile} stations={stations || []} />
}
