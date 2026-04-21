import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizView } from "@/components/user/quiz-view"

export default async function QuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
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

  // Check if already completed
  const { data: completion } = await supabase
    .from("quiz_completions")
    .select("*")
    .eq("user_id", user.id)
    .eq("quiz_id", id)
    .single()

  if (completion) {
    redirect("/user/news")
  }

  // Get quiz with questions
  const { data: quiz } = await supabase.from("quizzes").select("*").eq("id", id).eq("is_active", true).single()

  if (!quiz) {
    redirect("/user/news")
  }

  const { data: questions } = await supabase
    .from("quiz_questions")
    .select("*")
    .eq("quiz_id", id)
    .order("order_index", { ascending: true })

  return <QuizView profile={profile} quiz={quiz} questions={questions || []} />
}
