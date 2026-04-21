import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProductsManagement } from "@/components/admin/products-management"

export default async function ProductsPage() {
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

  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false })

  return <ProductsManagement profile={profile} products={products || []} />
}
