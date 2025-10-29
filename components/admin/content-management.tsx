"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Leaf, ArrowLeft, Plus, Trash2, Search, FileText, HelpCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"

interface News {
  id: string
  title: string
  content: string
  image_url: string | null
  published: boolean
  created_at: string
}

interface Quiz {
  id: string
  title: string
  description: string | null
  questions: any
  points_reward: number
  created_at: string
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface ContentManagementProps {
  profile: Profile
  news: News[]
  quizzes: Quiz[]
}

export function ContentManagement({ profile, news: initialNews, quizzes: initialQuizzes }: ContentManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [news, setNews] = useState(initialNews || [])
  const [quizzes, setQuizzes] = useState(initialQuizzes || [])
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateNewsOpen, setIsCreateNewsOpen] = useState(false)
  const [isCreateQuizOpen, setIsCreateQuizOpen] = useState(false)
  const [isEditNewsOpen, setIsEditNewsOpen] = useState(false)
  const [isEditQuizOpen, setIsEditQuizOpen] = useState(false)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const [newsFormData, setNewsFormData] = useState({
    title: "",
    content: "",
    image_url: "",
    published: true,
  })

  const [quizFormData, setQuizFormData] = useState({
    title: "",
    description: "",
    points_reward: 10,
    questions: [
      {
        question: "",
        options: ["", "", "", ""],
        correct_answer: 0,
      },
    ],
  })

  const filteredNews = news.filter((item) => item.title.toLowerCase().includes(searchTerm.toLowerCase()))

  const filteredQuizzes = quizzes.filter((item) => item?.title?.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleCreateNews = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase.from("news_articles").insert([
        {
          title: newsFormData.title,
          content: newsFormData.content,
          image_url: newsFormData.image_url || null,
          published: newsFormData.published,
          author_id: profile.id,
        },
      ])

      if (error) throw error

      toast({
        title: "Noticia creada",
        description: "La noticia ha sido publicada exitosamente.",
      })

      setIsCreateNewsOpen(false)
      setNewsFormData({ title: "", content: "", image_url: "", published: true })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuiz = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      // First, create the quiz
      const { data: newQuiz, error: quizError } = await supabase.from("quizzes").insert([
        {
          title: quizFormData.title,
          description: quizFormData.description || null,
          points_reward: quizFormData.points_reward,
          is_active: true,
        },
      ]).select().single()

      if (quizError) throw quizError

      // Then, create the questions
      const questionsToInsert = quizFormData.questions.map((q, index) => ({
        quiz_id: newQuiz.id,
        question: q.question,
        correct_answer: q.options[q.correct_answer],
        wrong_answer_1: q.options.filter((_, i) => i !== q.correct_answer)[0] || "",
        wrong_answer_2: q.options.filter((_, i) => i !== q.correct_answer)[1] || "",
        wrong_answer_3: q.options.filter((_, i) => i !== q.correct_answer)[2] || "",
        order_index: index,
      }))

      const { error: questionsError } = await supabase.from("quiz_questions").insert(questionsToInsert)

      if (questionsError) throw questionsError

      toast({
        title: "Quiz creado",
        description: "El quiz ha sido publicado exitosamente.",
      })

      setIsCreateQuizOpen(false)
      setQuizFormData({
        title: "",
        description: "",
        points_reward: 10,
        questions: [{ question: "", options: ["", "", "", ""], correct_answer: 0 }],
      })
      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteNews = async (newsId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta noticia?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("news_articles").delete().eq("id", newsId)

      if (error) throw error

      toast({
        title: "Noticia eliminada",
        description: "La noticia ha sido eliminada exitosamente.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const handleDeleteQuiz = async (quizId: string) => {
    if (!confirm("¿Estás seguro de eliminar este quiz?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("quizzes").delete().eq("id", quizId)

      if (error) throw error

      toast({
        title: "Quiz eliminado",
        description: "El quiz ha sido eliminado exitosamente.",
      })

      router.refresh()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  const addQuestion = () => {
    setQuizFormData({
      ...quizFormData,
      questions: [...quizFormData.questions, { question: "", options: ["", "", "", ""], correct_answer: 0 }],
    })
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...quizFormData.questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuizFormData({ ...quizFormData, questions: newQuestions })
  }

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const newQuestions = [...quizFormData.questions]
    newQuestions[questionIndex].options[optionIndex] = value
    setQuizFormData({ ...quizFormData, questions: newQuestions })
  }

  return (
    <div className="min-h-svh bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => router.push("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Gestionar Contenido</h1>
                <p className="text-xs text-muted-foreground">Noticias y quizzes educativos</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs defaultValue="news" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="news">Noticias</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Noticias Educativas</CardTitle>
                    <CardDescription>Total: {news.length} noticias</CardDescription>
                  </div>
                  <Dialog open={isCreateNewsOpen} onOpenChange={setIsCreateNewsOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Noticia
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Crear Nueva Noticia</DialogTitle>
                        <DialogDescription>Publicar contenido educativo sobre reciclaje</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateNews} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="news_title">Título</Label>
                          <Input
                            id="news_title"
                            value={newsFormData.title}
                            onChange={(e) => setNewsFormData({ ...newsFormData, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="news_content">Contenido</Label>
                          <Textarea
                            id="news_content"
                            value={newsFormData.content}
                            onChange={(e) => setNewsFormData({ ...newsFormData, content: e.target.value })}
                            rows={6}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="news_image_url">URL de Imagen (opcional)</Label>
                          <Input
                            id="news_image_url"
                            type="url"
                            value={newsFormData.image_url}
                            onChange={(e) => setNewsFormData({ ...newsFormData, image_url: e.target.value })}
                            placeholder="https://..."
                          />
                        </div>
                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creando..." : "Publicar Noticia"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar noticias..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredNews.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url || "/placeholder.svg"}
                                  alt={item.title}
                                  className="h-10 w-10 rounded object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                  <FileText className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <p className="font-medium">{item.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{item.content}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.published ? "default" : "secondary"}>
                              {item.published ? "Publicado" : "Borrador"}
                            </Badge>
                          </TableCell>
                          <TableCell>{new Date(item.created_at).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteNews(item.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quizzes" className="mt-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <CardTitle>Quizzes Educativos</CardTitle>
                    <CardDescription>Total: {quizzes.length} quizzes</CardDescription>
                  </div>
                  <Dialog open={isCreateQuizOpen} onOpenChange={setIsCreateQuizOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        Crear Quiz
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Crear Nuevo Quiz</DialogTitle>
                        <DialogDescription>Crear quiz educativo sobre reciclaje</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateQuiz} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="quiz_title">Título del Quiz</Label>
                          <Input
                            id="quiz_title"
                            value={quizFormData.title}
                            onChange={(e) => setQuizFormData({ ...quizFormData, title: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiz_description">Descripción</Label>
                          <Textarea
                            id="quiz_description"
                            value={quizFormData.description}
                            onChange={(e) => setQuizFormData({ ...quizFormData, description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="quiz_points">Puntos de Recompensa</Label>
                          <Input
                            id="quiz_points"
                            type="number"
                            min="0"
                            value={quizFormData.points_reward}
                            onChange={(e) =>
                              setQuizFormData({ ...quizFormData, points_reward: Number.parseInt(e.target.value) })
                            }
                            required
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Label>Preguntas</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addQuestion}>
                              <Plus className="mr-2 h-4 w-4" />
                              Agregar Pregunta
                            </Button>
                          </div>

                          {quizFormData.questions.map((q, qIndex) => (
                            <Card key={qIndex}>
                              <CardHeader>
                                <CardTitle className="text-sm">Pregunta {qIndex + 1}</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <Input
                                  placeholder="Escribe la pregunta..."
                                  value={q.question}
                                  onChange={(e) => updateQuestion(qIndex, "question", e.target.value)}
                                  required
                                />
                                <div className="space-y-2">
                                  <Label className="text-xs">Opciones</Label>
                                  {q.options.map((option: string, oIndex: number) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                      <Input
                                        placeholder={`Opción ${oIndex + 1}`}
                                        value={option}
                                        onChange={(e) => updateOption(qIndex, oIndex, e.target.value)}
                                        required
                                      />
                                      <input
                                        type="radio"
                                        name={`correct-${qIndex}`}
                                        checked={q.correct_answer === oIndex}
                                        onChange={() => updateQuestion(qIndex, "correct_answer", oIndex)}
                                        className="h-4 w-4"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        <Button type="submit" className="w-full" disabled={isLoading}>
                          {isLoading ? "Creando..." : "Publicar Quiz"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar quizzes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Preguntas</TableHead>
                        <TableHead>Puntos</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredQuizzes.map((quiz) => (
                        <TableRow key={quiz.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded bg-muted">
                                <HelpCircle className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="font-medium">{quiz.title}</p>
                                {quiz.description && (
                                  <p className="text-xs text-muted-foreground line-clamp-1">{quiz.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {Array.isArray(quiz.questions) ? quiz.questions.length : 0} preguntas
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{quiz.points_reward} pts</Badge>
                          </TableCell>
                          <TableCell>{new Date(quiz.created_at).toLocaleDateString("es-ES")}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteQuiz(quiz.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
