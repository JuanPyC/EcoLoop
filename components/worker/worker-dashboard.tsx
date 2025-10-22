"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Leaf, LogOut, AlertTriangle, MapPin, Trash2, Recycle, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface WasteBin {
  id: string
  waste_type: string
  capacity_percentage: number
  needs_attention: boolean
  qr_code: string
}

interface WasteStation {
  id: string
  name: string
  location: string
  description: string | null
  waste_bins: WasteBin[]
}

interface WorkerDashboardProps {
  profile: Profile
  stations: WasteStation[]
}

const wasteTypeConfig = {
  recyclable: {
    label: "Reciclable",
    icon: Recycle,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  organic: {
    label: "Orgánico",
    icon: Leaf,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  non_recyclable: {
    label: "No Reciclable",
    icon: Trash2,
    color: "text-gray-600",
    bgColor: "bg-gray-500/10",
  },
}

export function WorkerDashboard({ profile, stations: initialStations }: WorkerDashboardProps) {
  const [stations, setStations] = useState(initialStations)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBin, setSelectedBin] = useState<{ bin: WasteBin; station: WasteStation } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  const urgentBins = stations.flatMap((station) =>
    station.waste_bins.filter((bin) => bin.needs_attention).map((bin) => ({ station, bin })),
  )

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.location.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const handleEmptyBin = async () => {
    if (!selectedBin) return

    setIsUpdating(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from("waste_bins")
        .update({
          capacity_percentage: 0,
          needs_attention: false,
        })
        .eq("id", selectedBin.bin.id)

      if (error) throw error

      // Refresh stations
      const { data: newStations } = await supabase
        .from("waste_stations")
        .select(
          `
          *,
          waste_bins (
            *
          )
        `,
        )
        .order("name", { ascending: true })

      if (newStations) {
        setStations(newStations)
      }

      setSelectedBin(null)
      router.refresh()
    } catch (error) {
      console.error("[v0] Error emptying bin:", error)
      alert("Error al vaciar la canasta. Por favor, intenta de nuevo.")
    } finally {
      setIsUpdating(false)
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
              <h1 className="text-lg font-bold">Panel de Trabajador</h1>
              <p className="text-xs text-muted-foreground">{profile.full_name || "Trabajador"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={handleSignOut}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-6">
        {/* Urgent Attention Card */}
        {urgentBins.length > 0 && (
          <Card className="border-destructive/50 bg-destructive/5">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Atención Urgente</CardTitle>
              </div>
              <CardDescription>{urgentBins.length} canasta(s) necesitan ser vaciadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {urgentBins.map(({ station, bin }) => {
                const config = wasteTypeConfig[bin.waste_type as keyof typeof wasteTypeConfig]
                const Icon = config.icon

                return (
                  <div
                    key={bin.id}
                    className="flex items-center gap-3 rounded-lg border bg-background p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={() => setSelectedBin({ bin, station })}
                  >
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.bgColor}`}>
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{station.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{station.location}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="destructive">{bin.capacity_percentage}%</Badge>
                      <p className="text-xs text-muted-foreground mt-1">{config.label}</p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar estación por nombre o ubicación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Stations List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Todas las Estaciones</h2>
          {filteredStations.map((station) => (
            <Card key={station.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-base">{station.name}</CardTitle>
                    <CardDescription className="flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {station.location}
                    </CardDescription>
                  </div>
                  {station.waste_bins.some((bin) => bin.needs_attention) && (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertTriangle className="h-3 w-3" />
                      Urgente
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {station.waste_bins.map((bin) => {
                  const config = wasteTypeConfig[bin.waste_type as keyof typeof wasteTypeConfig]
                  const Icon = config.icon

                  return (
                    <div
                      key={bin.id}
                      className="space-y-2 rounded-lg border p-3 cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => setSelectedBin({ bin, station })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${config.color}`} />
                          <span className="text-sm font-medium">{config.label}</span>
                        </div>
                        <Badge variant={bin.needs_attention ? "destructive" : "secondary"}>
                          {bin.capacity_percentage}%
                        </Badge>
                      </div>
                      <Progress
                        value={bin.capacity_percentage}
                        className={bin.needs_attention ? "[&>div]:bg-destructive" : ""}
                      />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bin Details Dialog */}
      <Dialog open={!!selectedBin} onOpenChange={() => setSelectedBin(null)}>
        <DialogContent>
          {selectedBin && (
            <>
              <DialogHeader>
                <DialogTitle>Detalles de la Canasta</DialogTitle>
                <DialogDescription>{selectedBin.station.name}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                      wasteTypeConfig[selectedBin.bin.waste_type as keyof typeof wasteTypeConfig].bgColor
                    }`}
                  >
                    {(() => {
                      const Icon = wasteTypeConfig[selectedBin.bin.waste_type as keyof typeof wasteTypeConfig].icon
                      return (
                        <Icon
                          className={`h-6 w-6 ${
                            wasteTypeConfig[selectedBin.bin.waste_type as keyof typeof wasteTypeConfig].color
                          }`}
                        />
                      )
                    })()}
                  </div>
                  <div>
                    <p className="font-semibold">
                      {wasteTypeConfig[selectedBin.bin.waste_type as keyof typeof wasteTypeConfig].label}
                    </p>
                    <p className="text-sm text-muted-foreground">Código: {selectedBin.bin.qr_code}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacidad:</span>
                    <span className="font-semibold">{selectedBin.bin.capacity_percentage}%</span>
                  </div>
                  <Progress
                    value={selectedBin.bin.capacity_percentage}
                    className={selectedBin.bin.needs_attention ? "[&>div]:bg-destructive" : ""}
                  />
                </div>

                <div className="rounded-lg bg-muted p-3 space-y-1">
                  <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Ubicación:</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedBin.station.location}</p>
                </div>

                {selectedBin.bin.needs_attention && (
                  <div className="rounded-lg bg-destructive/10 p-3 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-destructive">
                      Esta canasta necesita atención urgente. La capacidad ha superado el 80%.
                    </p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedBin(null)} disabled={isUpdating}>
                  Cerrar
                </Button>
                <Button onClick={handleEmptyBin} disabled={isUpdating}>
                  {isUpdating ? "Vaciando..." : "Marcar como Vaciada"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
