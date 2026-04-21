"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Leaf, ArrowLeft, Plus, Pencil, Trash2, Search, MapPin, QrCode, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import QRCode from "qrcode"

interface WasteBin {
  id: string
  waste_type: string
  qr_code: string
  capacity_percentage: number
  current_weight: number
  needs_attention: boolean
  last_emptied?: string
}

interface WasteStation {
  id: string
  name: string
  location: string
  created_at: string
  waste_bins: WasteBin[]
}

interface Profile {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface StationsManagementProps {
  profile: Profile
  stations: WasteStation[]
}

export function StationsManagement({ profile, stations: initialStations }: StationsManagementProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [stations, setStations] = useState(initialStations)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedStation, setSelectedStation] = useState<WasteStation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrCodeUrls, setQrCodeUrls] = useState<{ type: string; url: string; code: string }[]>([])
  const [formData, setFormData] = useState({ name: "", location: "" }) // Declare formData here

  const filteredStations = stations.filter(
    (station) =>
      station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      station.location.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = createClient()

      const { data: newStation, error: stationError } = await supabase
        .from("waste_stations")
        .insert([
          {
            name: formData.name,
            location: formData.location,
          },
        ])
        .select()
        .single()

      if (stationError) throw stationError

      const bins = [
        {
          station_id: newStation.id,
          waste_type: "recyclable",
          capacity_percentage: 0,
          current_weight: 0,
          qr_code: `ECOLOOP-${newStation.id}-RECYCLABLE-${Date.now()}`,
        },
        {
          station_id: newStation.id,
          waste_type: "organic",
          capacity_percentage: 0,
          current_weight: 0,
          qr_code: `ECOLOOP-${newStation.id}-ORGANIC-${Date.now() + 1}`,
        },
        {
          station_id: newStation.id,
          waste_type: "non_recyclable",
          capacity_percentage: 0,
          current_weight: 0,
          qr_code: `ECOLOOP-${newStation.id}-NONRECYCLABLE-${Date.now() + 2}`,
        },
      ]

      const { error: binsError } = await supabase.from("waste_bins").insert(bins)

      if (binsError) throw binsError

      toast({
        title: "Estación creada",
        description: `${formData.name} ha sido creada con 3 canastas.`,
      })

      setIsCreateOpen(false)
      setFormData({ name: "", location: "" }) // Use setFormData here
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

  const handleEditStation = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStation) return

    setIsLoading(true)

    try {
      const supabase = createClient()

      const { error } = await supabase
        .from("waste_stations")
        .update({
          name: formData.name,
          location: formData.location,
        })
        .eq("id", selectedStation.id)

      if (error) throw error

      toast({
        title: "Estación actualizada",
        description: "Los cambios se han guardado exitosamente.",
      })

      setIsEditOpen(false)
      setSelectedStation(null)
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

  const handleDeleteStation = async (stationId: string) => {
    if (!confirm("¿Estás seguro de eliminar esta estación? Se eliminarán también todas sus canastas.")) return

    setIsLoading(true)
    try {
      const supabase = createClient()

      const { error } = await supabase.from("waste_stations").delete().eq("id", stationId)

      if (error) {
        console.error("[v0] Delete error:", error)
        throw error
      }

      toast({
        title: "Estación eliminada",
        description: "La estación y sus canastas han sido eliminadas exitosamente.",
      })

      setStations(stations.filter((s) => s.id !== stationId))
    } catch (error: any) {
      console.error("[v0] Error deleting station:", error)
      toast({
        title: "Error al eliminar",
        description: error.message || "No se pudo eliminar la estación. Verifica los permisos.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (station: WasteStation) => {
    setSelectedStation(station)
    setFormData({
      name: station.name,
      location: station.location,
    })
    setIsEditOpen(true)
  }

  const showQrCodes = async (station: WasteStation) => {
    try {
      const qrPromises = station.waste_bins.map(async (bin) => {
        const url = await QRCode.toDataURL(bin.qr_code, {
          width: 300,
          margin: 2,
          color: {
            dark: "#16a34a",
            light: "#ffffff",
          },
        })
        return {
          type: bin.waste_type,
          url,
          code: bin.qr_code,
        }
      })

      const urls = await Promise.all(qrPromises)
      setQrCodeUrls(urls)
      setSelectedStation(station)
      setIsQrDialogOpen(true)
    } catch (error) {
      console.error("[v0] Error generating QR codes:", error)
      toast({
        title: "Error",
        description: "No se pudieron generar los códigos QR",
        variant: "destructive",
      })
    }
  }

  const downloadQrCode = (url: string, type: string, stationName: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = `QR-${stationName}-${type}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getWasteTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      recyclable: "Reciclable",
      organic: "Orgánico",
      non_recyclable: "No Reciclable",
    }
    return labels[type] || type
  }

  const getWasteTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      recyclable: "bg-blue-500",
      organic: "bg-green-500",
      non_recyclable: "bg-gray-500",
    }
    return colors[type] || "bg-gray-500"
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
                <h1 className="text-lg font-bold">Gestionar Estaciones</h1>
                <p className="text-xs text-muted-foreground">Administrar puestos de basura</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Estaciones de Residuos</CardTitle>
                <CardDescription>Total: {stations.length} estaciones</CardDescription>
              </div>
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Estación
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Crear Nueva Estación</DialogTitle>
                    <DialogDescription>
                      Se crearán automáticamente 3 canastas (Reciclable, Orgánico, No Reciclable)
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateStation} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre de la Estación</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Estación Principal"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        placeholder="Ej: Edificio A, Piso 1"
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? "Creando..." : "Crear Estación"}
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
                placeholder="Buscar estaciones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            <div className="grid gap-4">
              {filteredStations.map((station) => (
                <Card key={station.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{station.name}</CardTitle>
                          <CardDescription>{station.location}</CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => showQrCodes(station)}>
                          <QrCode className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(station)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteStation(station.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {station.waste_bins.map((bin) => (
                        <div key={bin.id} className="rounded-lg border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`h-3 w-3 rounded-full ${getWasteTypeColor(bin.waste_type)}`} />
                            <p className="text-sm font-medium">{getWasteTypeLabel(bin.waste_type)}</p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Capacidad</span>
                              <Badge variant={bin.needs_attention ? "destructive" : "secondary"}>
                                {bin.capacity_percentage}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Peso</span>
                              <span className="font-medium">{bin.current_weight || 0} kg / 120 kg</span>
                            </div>
                            {bin.last_emptied && (
                              <p className="text-xs text-muted-foreground">
                                Vaciado: {new Date(bin.last_emptied).toLocaleDateString("es-ES")}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Estación</DialogTitle>
            <DialogDescription>Modificar información de la estación</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditStation} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit_name">Nombre de la Estación</Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit_location">Ubicación</Label>
              <Input
                id="edit_location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isQrDialogOpen} onOpenChange={setIsQrDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Códigos QR - {selectedStation?.name}</DialogTitle>
            <DialogDescription>Descarga los códigos QR para cada tipo de canasta</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 sm:grid-cols-3">
            {qrCodeUrls.map((qr) => (
              <div key={qr.type} className="space-y-3">
                <div className="rounded-lg border p-4 bg-white">
                  <img src={qr.url || "/placeholder.svg"} alt={`QR ${qr.type}`} className="w-full h-auto" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-center">{getWasteTypeLabel(qr.type)}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full bg-transparent"
                    onClick={() => downloadQrCode(qr.url, qr.type, selectedStation?.name || "estacion")}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Descargar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
