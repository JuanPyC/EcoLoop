import { redirect } from "next/navigation"
import { createClient } from "@/lib/api/server"
import { NewsView } from "@/components/user/news-view"

export default async function NewsPage() {
  const apiClient = await createClient()

  const {
    data: { user },
  } = await apiClient.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await apiClient.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "user") {
    redirect("/auth/login")
  }

  // Get published news articles
  const { data: articles } = await apiClient
    .from("news_articles")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })

  // Get active quizzes
  const { data: quizzes } = await apiClient
    .from("quizzes")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })

  // Get user's quiz completions
  const { data: completions } = await apiClient.from("quiz_completions").select("quiz_id").eq("user_id", user.id)

  const completedQuizIds = completions?.map((c) => c.quiz_id) || []

  return (
    <NewsView profile={profile} articles={articles || []} quizzes={quizzes || []} completedQuizIds={completedQuizIds} />
  )
}
