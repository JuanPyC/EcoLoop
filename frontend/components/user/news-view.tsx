"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Newspaper, Brain, CheckCircle2, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

interface Profile {
  id: string
  eco_points: number
  full_name: string | null
}

interface Article {
  id: string
  title: string
  content: string
  image_url: string | null
  created_at: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  points_reward: number
  is_active: boolean
}

interface NewsViewProps {
  profile: Profile
  articles: Article[]
  quizzes: Quiz[]
  completedQuizIds: string[]
}

export function NewsView({ profile, articles, quizzes, completedQuizIds }: NewsViewProps) {
  return (
    <div className="min-h-svh bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4 px-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Noticias y Quizzes</h1>
            <p className="text-xs text-muted-foreground">Aprende y gana puntos</p>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Noticias
            </TabsTrigger>
            <TabsTrigger value="quizzes" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Quizzes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="mt-6 space-y-4">
            {articles.map((article) => {
              const date = new Date(article.created_at)
              return (
                <Card key={article.id}>
                  {article.image_url && (
                    <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
                      <Image
                        src={article.image_url || "/placeholder.svg"}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-balance">{article.title}</CardTitle>
                    <CardDescription>
                      {date.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground text-balance leading-relaxed">{article.content}</p>
                  </CardContent>
                </Card>
              )
            })}
            {articles.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Newspaper className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No hay noticias disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6 space-y-4">
            {quizzes.map((quiz) => {
              const isCompleted = completedQuizIds.includes(quiz.id)
              return (
                <Card key={quiz.id} className={isCompleted ? "opacity-60" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <CardTitle className="text-base text-balance">{quiz.title}</CardTitle>
                        {quiz.description && (
                          <CardDescription className="mt-1 text-balance">{quiz.description}</CardDescription>
                        )}
                      </div>
                      {isCompleted ? (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Completado
                        </Badge>
                      ) : (
                        <Badge className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Disponible
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg bg-primary/10 p-3">
                      <span className="text-sm font-medium text-primary">Recompensa:</span>
                      <Badge variant="secondary" className="font-bold">
                        +{quiz.points_reward} puntos
                      </Badge>
                    </div>
                    <Button asChild className="w-full" disabled={isCompleted}>
                      <Link href={`/user/quiz/${quiz.id}`}>{isCompleted ? "Ya Completado" : "Comenzar Quiz"}</Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
            {quizzes.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">No hay quizzes disponibles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
