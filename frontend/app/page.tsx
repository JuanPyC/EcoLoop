import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"

export default async function HomePage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile to check role
  const { data: profile } = await apiClient.from("profiles").select("role").eq("id", user.id).single()

  // Redirect based on role
  if (profile?.role === "admin") {
    redirect("/admin")
  } else if (profile?.role === "worker") {
    redirect("/worker")
  } else {
    redirect("/user")
  }
}
