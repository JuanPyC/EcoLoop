import { createClient } from "@/lib/api/server"
import { redirect } from "next/navigation"
import { UsersManagement } from "@/components/admin/users-management"

export default async function UsersPage() {
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

  // Fetch all users
  const { data: users } = await apiClient.from("profiles").select("*").order("created_at", { ascending: false })

  return <UsersManagement profile={profile} users={users || []} />
}
