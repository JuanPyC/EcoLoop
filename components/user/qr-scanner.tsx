"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { Camera, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Html5Qrcode } from "html5-qrcode"

interface QrScannerProps {
  userId: string
  onScanSuccess: () => void
}

const POINTS_BY_TYPE = {
  recyclable: 10,
  organic: 8,
  non_recyclable: 5,
}

const POINTS_PER_KG = {
  recyclable: 2,
  organic: 1.5,
  non_recyclable: 1,
}

const MAX_CAPACITY_KG = 120

export function QrScanner({ userId, onScanSuccess }: QrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<{
    success: boolean
    message: string
    points?: number
  } | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [scannedBin, setScannedBin] = useState<any>(null)
  const [wasteAmount, setWasteAmount] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shouldStartScanner, setShouldStartScanner] = useState(false)

  useEffect(() => {
    if (!shouldStartScanner || scannerRef.current) return

    const initScanner = async () => {
      try {
        console.log("[v0] Initializing scanner...")
        
        // Check if element exists
        const element = document.getElementById("qr-reader")
        if (!element) {
          console.error("[v0] QR reader element not found")
          return
        }

        const html5QrCode = new Html5Qrcode("qr-reader")
        scannerRef.current = html5QrCode

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            if (isProcessing) return

            setIsProcessing(true)
            await handleScan(decodedText)

            if (scannerRef.current) {
              try {
                await scannerRef.current.stop()
              } catch (err) {
                console.error("[v0] Error stopping scanner after scan:", err)
              }
            }
            setIsScanning(false)
            setShouldStartScanner(false)
            setIsProcessing(false)
          },
          () => {
            // Error callback - ignore
          },
        )

        setHasPermission(true)
        console.log("[v0] Scanner started successfully")
      } catch (err) {
        console.error("[v0] Error starting scanner:", err)
        setHasPermission(false)
        setIsScanning(false)
        setShouldStartScanner(false)
        setScanResult({
          success: false,
          message: "No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara.",
        })
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(initScanner, 100)
    return () => clearTimeout(timer)
  }, [shouldStartScanner])

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanning = () => {
    setHasPermission(null)
    setScanResult(null)
    setIsScanning(true)
    setShouldStartScanner(true)
  }

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop()
      } catch (error) {
        console.error("[v0] Error stopping scanner:", error)
      }
      scannerRef.current = null
    }
    setIsScanning(false)
    setShouldStartScanner(false)
  }

  const handleScan = async (qrCode: string) => {
    const supabase = createClient()

    try {
      console.log("[v0] Scanned QR code:", qrCode)

      // Find the waste bin by QR code
      const { data: bin, error: binError } = await supabase
        .from("waste_bins")
        .select(
          `
          *,
          waste_stations (
            name,
            location
          )
        `,
        )
        .eq("qr_code", qrCode)
        .single()

      if (binError || !bin) {
        console.error("[v0] Bin not found:", binError)
        setScanResult({
          success: false,
          message: "Código QR no válido. Por favor, escanea un código de una canasta de basura.",
        })
        return
      }

      console.log("[v0] Bin found:", bin)

      setScannedBin(bin)
    } catch (error) {
      console.error("[v0] Error processing scan:", error)
      setScanResult({
        success: false,
        message: "Error al procesar el escaneo. Por favor, intenta de nuevo.",
      })
    }
  }

  const handleSubmitDeposit = async () => {
    if (!scannedBin || !wasteAmount) return

    setIsSubmitting(true)
    const supabase = createClient()

    try {
      const amount = Number.parseFloat(wasteAmount)
      if (isNaN(amount) || amount <= 0) {
        setScanResult({
          success: false,
          message: "Por favor, ingresa una cantidad válida mayor a 0.",
        })
        setIsSubmitting(false)
        return
      }

      const currentWeight = scannedBin.current_weight || 0
      const newWeight = Math.min(currentWeight + amount, MAX_CAPACITY_KG)
      const newCapacity = Math.round((newWeight / MAX_CAPACITY_KG) * 100)

      // Check if bin is full
      if (currentWeight >= MAX_CAPACITY_KG) {
        setScanResult({
          success: false,
          message: "Esta canasta está llena. Por favor, usa otra canasta o notifica al personal.",
        })
        setIsSubmitting(false)
        return
      }

      // Calculate points based on waste type and amount
      const basePoints = POINTS_BY_TYPE[scannedBin.waste_type as keyof typeof POINTS_BY_TYPE]
      const pointsPerKg = POINTS_PER_KG[scannedBin.waste_type as keyof typeof POINTS_PER_KG]
      const totalPoints = Math.round(basePoints + amount * pointsPerKg)

      console.log("[v0] Depositing:", { amount, currentWeight, newWeight, newCapacity, totalPoints })

      // Create transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: userId,
        bin_id: scannedBin.id,
        points_earned: totalPoints,
        waste_type: scannedBin.waste_type,
      })

      if (transactionError) {
        console.error("[v0] Transaction error:", transactionError)
        throw transactionError
      }

      const { error: updateError } = await supabase
        .from("waste_bins")
        .update({
          capacity_percentage: newCapacity,
          current_weight: newWeight,
          needs_attention: newCapacity >= 80,
        })
        .eq("id", scannedBin.id)

      if (updateError) {
        console.error("[v0] Update error:", updateError)
        throw updateError
      }

      const wasteTypeLabel =
        scannedBin.waste_type === "recyclable"
          ? "reciclables"
          : scannedBin.waste_type === "organic"
            ? "orgánicos"
            : "no reciclables"

      setScanResult({
        success: true,
        message: `¡Excelente! Has depositado ${amount}kg de residuos ${wasteTypeLabel} en ${scannedBin.waste_stations.name} y ganado ${totalPoints} EcoPoints. Capacidad actual: ${newCapacity}%`,
        points: totalPoints,
      })

      setScannedBin(null)
      setWasteAmount("")
      onScanSuccess()
    } catch (error) {
      console.error("[v0] Error submitting deposit:", error)
      setScanResult({
        success: false,
        message: "Error al registrar el depósito. Por favor, intenta de nuevo.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelDeposit = () => {
    setScannedBin(null)
    setWasteAmount("")
    setScanResult(null)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Escanear Código QR</CardTitle>
          <CardDescription>Escanea el código QR de una canasta de basura para depositar residuos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning && !scanResult && !scannedBin && (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Camera className="h-12 w-12 text-primary" />
              </div>
              <p className="text-center text-sm text-muted-foreground text-balance">
                Presiona el botón para activar la cámara y escanear un código QR
              </p>
              <Button onClick={startScanning} size="lg" className="w-full max-w-xs">
                <Camera className="mr-2 h-5 w-5" />
                Activar Cámara
              </Button>
            </div>
          )}

          {hasPermission === false && (
            <div className="rounded-lg bg-destructive/10 p-4 text-center">
              <p className="text-sm text-destructive">
                No se pudo acceder a la cámara. Por favor, permite el acceso en la configuración de tu navegador.
              </p>
            </div>
          )}

          {isScanning && (
            <div className="space-y-4">
              <div id="qr-reader" className="overflow-hidden rounded-lg" />
              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </div>
              )}
              <Button onClick={stopScanning} variant="outline" className="w-full bg-transparent">
                Cancelar
              </Button>
            </div>
          )}

          {scannedBin && !scanResult && (
            <div className="space-y-4">
              <div className="rounded-lg bg-primary/10 p-4">
                <h3 className="font-semibold text-primary mb-2">Canasta Escaneada</h3>
                <p className="text-sm text-muted-foreground">
                  <strong>Estación:</strong> {scannedBin.waste_stations.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Tipo:</strong>{" "}
                  {scannedBin.waste_type === "recyclable"
                    ? "Reciclable"
                    : scannedBin.waste_type === "organic"
                      ? "Orgánico"
                      : "No Reciclable"}
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Peso actual:</strong> {scannedBin.current_weight || 0}kg / {MAX_CAPACITY_KG}kg
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Capacidad:</strong> {scannedBin.capacity_percentage}%
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wasteAmount">Cantidad de residuos (kg)</Label>
                <Input
                  id="wasteAmount"
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder="Ej: 2.5"
                  value={wasteAmount}
                  onChange={(e) => setWasteAmount(e.target.value)}
                  disabled={isSubmitting}
                />
                <p className="text-xs text-muted-foreground">
                  Ingresa la cantidad aproximada de residuos que vas a depositar (máximo {MAX_CAPACITY_KG}kg por
                  canasta)
                </p>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSubmitDeposit} disabled={isSubmitting || !wasteAmount} className="flex-1">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    "Depositar Residuos"
                  )}
                </Button>
                <Button onClick={handleCancelDeposit} variant="outline" disabled={isSubmitting}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}

          {scanResult && (
            <div className="space-y-4">
              <div className={`rounded-lg p-4 ${scanResult.success ? "bg-primary/10" : "bg-destructive/10"}`}>
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-6 w-6 text-destructive flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`text-sm ${scanResult.success ? "text-primary" : "text-destructive"}`}>
                      {scanResult.message}
                    </p>
                    {scanResult.success && scanResult.points && (
                      <p className="mt-2 text-2xl font-bold text-primary">+{scanResult.points} EcoPoints</p>
                    )}
                  </div>
                </div>
              </div>
              <Button onClick={() => setScanResult(null)} className="w-full">
                Escanear Otro Código
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Sistema de Puntos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">Puntos base por depósito:</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Reciclable</span>
                <span className="font-semibold text-primary">10 puntos base</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Orgánico</span>
                <span className="font-semibold text-primary">8 puntos base</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">No Reciclable</span>
                <span className="font-semibold text-primary">5 puntos base</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground pt-2">+ Puntos adicionales según la cantidad depositada (kg)</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
