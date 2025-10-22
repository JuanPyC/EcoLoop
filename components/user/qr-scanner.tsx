"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const startScanning = async () => {
    try {
      setHasPermission(null)
      setScanResult(null)

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
          await html5QrCode.stop()
          setIsScanning(false)
          setIsProcessing(false)
        },
        () => {
          // Error callback - ignore
        },
      )

      setIsScanning(true)
      setHasPermission(true)
    } catch (err) {
      console.error("[v0] Error starting scanner:", err)
      setHasPermission(false)
      setScanResult({
        success: false,
        message: "No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara.",
      })
    }
  }

  const stopScanning = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
      setIsScanning(false)
    }
  }

  const handleScan = async (qrCode: string) => {
    const supabase = createClient()

    try {
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
        setScanResult({
          success: false,
          message: "Código QR no válido. Por favor, escanea un código de una canasta de basura.",
        })
        return
      }

      // Calculate points based on waste type
      const points = POINTS_BY_TYPE[bin.waste_type as keyof typeof POINTS_BY_TYPE]

      // Create transaction
      const { error: transactionError } = await supabase.from("transactions").insert({
        user_id: userId,
        bin_id: bin.id,
        points_earned: points,
        waste_type: bin.waste_type,
      })

      if (transactionError) {
        throw transactionError
      }

      // Update bin capacity (simulate filling)
      const newCapacity = Math.min(bin.capacity_percentage + 5, 100)
      await supabase.from("waste_bins").update({ capacity_percentage: newCapacity }).eq("id", bin.id)

      setScanResult({
        success: true,
        message: `¡Excelente! Has ganado ${points} EcoPoints por depositar residuos ${
          bin.waste_type === "recyclable"
            ? "reciclables"
            : bin.waste_type === "organic"
              ? "orgánicos"
              : "no reciclables"
        } en ${bin.waste_stations.name}.`,
        points,
      })

      onScanSuccess()
    } catch (error) {
      console.error("[v0] Error processing scan:", error)
      setScanResult({
        success: false,
        message: "Error al procesar el escaneo. Por favor, intenta de nuevo.",
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Escanear Código QR</CardTitle>
          <CardDescription>Escanea el código QR de una canasta de basura para ganar puntos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isScanning && !scanResult && (
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
          <CardTitle className="text-base">Puntos por Tipo de Residuo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Reciclable</span>
              <span className="font-semibold text-primary">10 puntos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Orgánico</span>
              <span className="font-semibold text-primary">8 puntos</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">No Reciclable</span>
              <span className="font-semibold text-primary">5 puntos</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
