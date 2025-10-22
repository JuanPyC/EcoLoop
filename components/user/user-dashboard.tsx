"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrScanner } from "@/components/user/qr-scanner"
import { TransactionHistory } from "@/components/user/transaction-history"
import { Leaf, QrCode, History, Store, Newspaper, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Profile {
  id: string
  email: string
  full_name: string | null
  eco_points: number
  role: string
}

interface Transaction {
  id: string
  points_earned: number
  waste_type: string
  created_at: string
  waste_bins: {
    waste_type: string
    waste_stations: {
      name: string
      location: string
    }
  }
}

interface UserDashboardProps {
  profile: Profile
  transactions: Transaction[]
}

export function UserDashboard({ profile: initialProfile, transactions: initialTransactions }: UserDashboardProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [transactions, setTransactions] = useState(initialTransactions)
  const [activeTab, setActiveTab] = useState("scan")
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const refreshData = async () => {
    const supabase = createClient()

    // Refresh profile
    const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single()

    if (newProfile) {
      setProfile(newProfile)
    }

    // Refresh transactions
    const { data: newTransactions } = await supabase
      .from("transactions")
      .select(
        `
        *,
        waste_bins (
          waste_type,
          waste_stations (
            name,
            location
          )
        )
      `,
      )
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (newTransactions) {
      setTransactions(newTransactions)
    }
  }

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
              <h1 className="text-lg font-bold">EcoLoop</h1>
              <p className="text-xs text-muted-foreground">Hola, {profile.full_name || "Usuario"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Points Card */}
      <div className="container px-4 py-6">
        <Card className="bg-gradient-to-br from-primary to-accent border-0 text-primary-foreground">
          <CardHeader>
            <CardDescription className="text-primary-foreground/80">Tus EcoPoints</CardDescription>
            <CardTitle className="text-5xl font-bold">{profile.eco_points}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-primary-foreground/80">
              Sigue reciclando para ganar más puntos y canjearlos por productos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="container px-4 pb-24">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="scan" className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              <span className="hidden sm:inline">Escanear</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">Historial</span>
            </TabsTrigger>
            <TabsTrigger value="store" className="flex items-center gap-2" asChild>
              <Link href="/user/store">
                <Store className="h-4 w-4" />
                <span className="hidden sm:inline">Tienda</span>
              </Link>
            </TabsTrigger>
            <TabsTrigger value="news" className="flex items-center gap-2" asChild>
              <Link href="/user/news">
                <Newspaper className="h-4 w-4" />
                <span className="hidden sm:inline">Noticias</span>
              </Link>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="scan" className="mt-6">
            <QrScanner userId={profile.id} onScanSuccess={refreshData} />
          </TabsContent>

          <TabsContent value="history" className="mt-6">
            <TransactionHistory transactions={transactions} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
