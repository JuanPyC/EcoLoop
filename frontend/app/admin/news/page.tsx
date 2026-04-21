import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ContentManagement } from "@/components/admin/content-management"

export default async function NewsPage() {
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

  const { data: news } = await supabase.from("news_articles").select("*").order("created_at", { ascending: false })

  const { data: quizzes } = await supabase.from("quizzes").select("*").order("created_at", { ascending: false })

  return <ContentManagement profile={profile} news={news || []} quizzes={quizzes || []} />
}
