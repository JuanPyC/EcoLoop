"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Leaf, LogOut, Users, TrendingUp, Coins, BarChart3, UserPlus, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import Link from "next/link"

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface Stats {
  totalUsers: number
  totalTransactions: number
  totalPointsRedeemed: number
}

interface Transaction {
  waste_type: string
  points_earned: number
  created_at: string
}

interface WasteBin {
  waste_type: string
  capacity_percentage: number
  needs_attention: boolean
  waste_stations: {
    name: string
  }
}

interface Redemption {
  id: string
  points_spent: number
  status: string
  created_at: string
  profiles: {
    full_name: string | null
    email: string
  }
  products: {
    name: string
  }
}

interface AdminDashboardProps {
  profile: Profile
  stats: Stats
  transactions: Transaction[]
  wasteBins: WasteBin[]
  recentRedemptions: Redemption[]
}

const COLORS = {
  recyclable: "#3b82f6",
  organic: "#22c55e",
  non_recyclable: "#6b7280",
}

export function AdminDashboard({ profile, stats, transactions, wasteBins, recentRedemptions }: AdminDashboardProps) {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  // Calculate waste type distribution
  const wasteTypeData = [
    {
      name: "Reciclable",
      value: transactions.filter((t) => t.waste_type === "recyclable").length,
      color: COLORS.recyclable,
    },
    {
      name: "Orgánico",
      value: transactions.filter((t) => t.waste_type === "organic").length,
      color: COLORS.organic,
    },
    {
      name: "No Reciclable",
      value: transactions.filter((t) => t.waste_type === "non_recyclable").length,
      color: COLORS.non_recyclable,
    },
  ]

  // Calculate average capacity by waste type
  const capacityByType = [
    {
      type: "Reciclable",
      capacidad:
        wasteBins.filter((b) => b.waste_type === "recyclable").reduce((sum, b) => sum + b.capacity_percentage, 0) /
          wasteBins.filter((b) => b.waste_type === "recyclable").length || 0,
    },
    {
      type: "Orgánico",
      capacidad:
        wasteBins.filter((b) => b.waste_type === "organic").reduce((sum, b) => sum + b.capacity_percentage, 0) /
          wasteBins.filter((b) => b.waste_type === "organic").length || 0,
    },
    {
      type: "No Reciclable",
      capacidad:
        wasteBins.filter((b) => b.waste_type === "non_recyclable").reduce((sum, b) => sum + b.capacity_percentage, 0) /
          wasteBins.filter((b) => b.waste_type === "non_recyclable").length || 0,
    },
  ]

  // Find bins that fill fastest
  const binsNeedingAttention = wasteBins.filter((b) => b.needs_attention)

  return (
    <div className="min-h-svh bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Leaf className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Panel de Administrador</h1>
              <p className="text-xs text-muted-foreground">{profile.full_name || "Admin"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="analytics">Analíticas</TabsTrigger>
            <TabsTrigger value="management">Gestión</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Usuarios Totales</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">Usuarios registrados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Transacciones</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                  <p className="text-xs text-muted-foreground">Escaneos realizados</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Puntos Canjeados</CardTitle>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalPointsRedeemed}</div>
                  <p className="text-xs text-muted-foreground">EcoPoints totales</p>
                </CardContent>
              </Card>
            </div>

            {/* Recent Redemptions */}
            <Card>
              <CardHeader>
                <CardTitle>Canjes Recientes</CardTitle>
                <CardDescription>Últimas 10 transacciones de la tienda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentRedemptions.map((redemption) => {
                    const date = new Date(redemption.created_at)
                    return (
                      <div key={redemption.id} className="flex items-center justify-between rounded-lg border p-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{redemption.products.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {redemption.profiles.full_name || redemption.profiles.email}
                          </p>
                        </div>
                        <div className="text-right ml-4">
                          <Badge variant="secondary">-{redemption.points_spent} pts</Badge>
                          <p className="text-xs text-muted-foreground mt-1">
                            {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6 space-y-6">
            {/* Waste Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Residuos</CardTitle>
                <CardDescription>¿Qué tipo de residuo se desecha más?</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={wasteTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {wasteTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bin Capacity by Type */}
            <Card>
              <CardHeader>
                <CardTitle>Capacidad Promedio por Tipo</CardTitle>
                <CardDescription>¿Cuál canasta se llena más rápido?</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={capacityByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="capacidad" fill="hsl(var(--primary))" name="Capacidad (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Bins Needing Attention */}
            <Card>
              <CardHeader>
                <CardTitle>Canastas que Necesitan Atención</CardTitle>
                <CardDescription>{binsNeedingAttention.length} canasta(s) con capacidad mayor al 80%</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {binsNeedingAttention.map((bin, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium text-sm">{bin.waste_stations.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {bin.waste_type === "recyclable"
                            ? "Reciclable"
                            : bin.waste_type === "organic"
                              ? "Orgánico"
                              : "No Reciclable"}
                        </p>
                      </div>
                      <Badge variant="destructive">{bin.capacity_percentage}%</Badge>
                    </div>
                  ))}
                  {binsNeedingAttention.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Todas las canastas están en buen estado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management" className="mt-6 space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" asChild>
                <Link href="/admin/users">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <UserPlus className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gestionar Usuarios</CardTitle>
                        <CardDescription>Crear trabajadores y administradores</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" asChild>
                <Link href="/admin/products">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gestionar Productos</CardTitle>
                        <CardDescription>Administrar tienda y stock</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" asChild>
                <Link href="/admin/stations">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <BarChart3 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gestionar Estaciones</CardTitle>
                        <CardDescription>Administrar puestos de basura</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>

              <Card className="cursor-pointer hover:bg-accent/50 transition-colors" asChild>
                <Link href="/admin/news">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Settings className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">Gestionar Contenido</CardTitle>
                        <CardDescription>Noticias y quizzes</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Link>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
