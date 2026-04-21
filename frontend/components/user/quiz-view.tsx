"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, CheckCircle2, XCircle, Trophy } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  eco_points: number
}

interface Quiz {
  id: string
  title: string
  description: string | null
  points_reward: number
}

interface Question {
  id: string
  question: string
  correct_answer: string
  wrong_answer_1: string
  wrong_answer_2: string
  wrong_answer_3: string
  order_index: number
}

interface QuizViewProps {
  profile: Profile
  quiz: Quiz
  questions: Question[]
}

export function QuizView({ profile, quiz, questions }: QuizViewProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [answers, setAnswers] = useState<{ questionId: string; answer: string; correct: boolean }[]>([])
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

  // Shuffle answers
  const shuffledAnswers = currentQuestion
    ? [
        currentQuestion.correct_answer,
        currentQuestion.wrong_answer_1,
        currentQuestion.wrong_answer_2,
        currentQuestion.wrong_answer_3,
      ].sort(() => Math.random() - 0.5)
    : []

  const handleNext = () => {
    if (!selectedAnswer) return

    const isCorrect = selectedAnswer === currentQuestion.correct_answer

    setAnswers([
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct: isCorrect,
      },
    ])

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setSelectedAnswer("")
    } else {
      handleComplete(isCorrect)
    }
  }

  const handleComplete = async (lastAnswerCorrect: boolean) => {
    setIsSubmitting(true)
    const supabase = createClient()

    const allAnswers = [
      ...answers,
      {
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        correct: lastAnswerCorrect,
      },
    ]

    const score = allAnswers.filter((a) => a.correct).length
    const pointsEarned = Math.round((score / questions.length) * quiz.points_reward)

    try {
      const { error } = await supabase.from("quiz_completions").insert({
        user_id: profile.id,
        quiz_id: quiz.id,
        score,
        points_earned: pointsEarned,
      })

      if (error) throw error

      setIsCompleted(true)
    } catch (error) {
      console.error("[v0] Error completing quiz:", error)
      alert("Error al completar el quiz. Por favor, intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isCompleted) {
    const score = answers.filter((a) => a.correct).length
    const pointsEarned = Math.round((score / questions.length) * quiz.points_reward)

    return (
      <div className="min-h-svh bg-gradient-to-br from-primary/5 via-background to-accent/5 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">¡Quiz Completado!</CardTitle>
            <CardDescription>Has terminado el quiz exitosamente</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-center">
              <p className="text-sm text-muted-foreground">Tu puntuación</p>
              <p className="text-3xl font-bold text-primary">
                {score} / {questions.length}
              </p>
            </div>
            <div className="rounded-lg bg-primary/10 p-4 text-center">
              <p className="text-sm text-primary font-medium">Puntos ganados</p>
              <p className="text-2xl font-bold text-primary">+{pointsEarned} EcoPoints</p>
            </div>
            <Button asChild className="w-full">
              <Link href="/user/news">Volver a Noticias</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/news">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">{quiz.title}</h1>
            <p className="text-xs text-muted-foreground">
              Pregunta {currentQuestionIndex + 1} de {questions.length}
            </p>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-medium">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} />
          </div>

          {/* Question Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-balance">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
                {shuffledAnswers.map((answer, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-3 rounded-lg border p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={answer} id={`answer-${index}`} />
                    <Label htmlFor={`answer-${index}`} className="flex-1 cursor-pointer text-balance">
                      {answer}
                    </Label>
                  </div>
                ))}
              </RadioGroup>

              <Button onClick={handleNext} disabled={!selectedAnswer || isSubmitting} className="w-full">
                {isSubmitting
                  ? "Enviando..."
                  : currentQuestionIndex < questions.length - 1
                    ? "Siguiente Pregunta"
                    : "Finalizar Quiz"}
              </Button>
            </CardContent>
          </Card>

          {/* Answer History */}
          {answers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Respuestas Anteriores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  {answers.map((answer, index) => (
                    <div
                      key={index}
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        answer.correct ? "bg-green-500/10" : "bg-red-500/10"
                      }`}
                    >
                      {answer.correct ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
