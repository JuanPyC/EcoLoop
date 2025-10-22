import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { NewsView } from "@/components/user/news-view"

export default async function NewsPage() {
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

  // Get published news articles
  const { data: articles } = await supabase
    .from("news_articles")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })

  // Get active quizzes
  const { data: quizzes } = await supabase
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get user's quiz completions
  const { data: completions } = await supabase.from("quiz_completions").select("quiz_id").eq("user_id", user.id)

  const completedQuizIds = completions?.map((c) => c.quiz_id) || []

  return (
    <NewsView profile={profile} articles={articles || []} quizzes={quizzes || []} completedQuizIds={completedQuizIds} />
  )
}
