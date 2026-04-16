import { createClient } from "@/lib/api/server"
import { redirect } from "next/navigation"
import { ProductsManagement } from "@/components/admin/products-management"

export default async function ProductsPage() {
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

  const { data: products } = await apiClient.from("products").select("*").order("created_at", { ascending: false })

  return <ProductsManagement profile={profile} products={products || []} />
}
