"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, ShoppingCart, Package, CheckCircle2, Coins } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

interface Profile {
  id: string
  eco_points: number
  full_name: string | null
}

interface Product {
  id: string
  name: string
  description: string | null
  points_cost: number
  image_url: string | null
  stock: number
  category: string
}

interface Redemption {
  id: string
  points_spent: number
  quantity: number
  status: string
  created_at: string
  products: {
    name: string
    image_url: string | null
  }
}

interface StoreViewProps {
  profile: Profile
  products: Product[]
  redemptions: Redemption[]
}

export function StoreView({ profile: initialProfile, products, redemptions: initialRedemptions }: StoreViewProps) {
  const [profile, setProfile] = useState(initialProfile)
  const [redemptions, setRedemptions] = useState(initialRedemptions)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [redeemSuccess, setRedeemSuccess] = useState(false)
  const router = useRouter()

  const categories = Array.from(new Set(products.map((p) => p.category)))

  const handleRedeem = async () => {
    if (!selectedProduct) return

    setIsRedeeming(true)
    const supabase = createClient()

    try {
      // Check if user has enough points
      if (profile.eco_points < selectedProduct.points_cost) {
        alert("No tienes suficientes EcoPoints para canjear este producto")
        return
      }

      // Check stock
      if (selectedProduct.stock < 1) {
        alert("Este producto está agotado")
        return
      }

      // Create redemption
      const { error } = await supabase.from("redemptions").insert({
        user_id: profile.id,
        product_id: selectedProduct.id,
        points_spent: selectedProduct.points_cost,
        quantity: 1,
        status: "pending",
      })

      if (error) throw error

      // Refresh profile
      const { data: newProfile } = await supabase.from("profiles").select("*").eq("id", profile.id).single()

      if (newProfile) {
        setProfile(newProfile)
      }

      // Refresh redemptions
      const { data: newRedemptions } = await supabase
        .from("redemptions")
        .select(
          `
          *,
          products (
            name,
            image_url
          )
        `,
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(5)

      if (newRedemptions) {
        setRedemptions(newRedemptions)
      }

      setRedeemSuccess(true)
      setTimeout(() => {
        setSelectedProduct(null)
        setRedeemSuccess(false)
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error("[v0] Error redeeming product:", error)
      alert("Error al canjear el producto. Por favor, intenta de nuevo.")
    } finally {
      setIsRedeeming(false)
    }
  }

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
            <h1 className="text-lg font-bold">Tienda EcoLoop</h1>
            <p className="text-xs text-muted-foreground">Canjea tus puntos por productos</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-2">
            <Coins className="h-4 w-4 text-primary" />
            <span className="font-bold text-primary">{profile.eco_points}</span>
          </div>
        </div>
      </header>

      <div className="container px-4 py-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">Todos</TabsTrigger>
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
            <TabsTrigger value="redemptions">Mis Canjes</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  userPoints={profile.eco_points}
                  onSelect={setSelectedProduct}
                />
              ))}
            </div>
          </TabsContent>

          {categories.map((category) => (
            <TabsContent key={category} value={category} className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {products
                  .filter((p) => p.category === category)
                  .map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      userPoints={profile.eco_points}
                      onSelect={setSelectedProduct}
                    />
                  ))}
              </div>
            </TabsContent>
          ))}

          <TabsContent value="redemptions" className="mt-6">
            <RedemptionsList redemptions={redemptions} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Redemption Dialog */}
      <Dialog open={!!selectedProduct} onOpenChange={() => setSelectedProduct(null)}>
        <DialogContent>
          {redeemSuccess ? (
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center">¡Canje Exitoso!</DialogTitle>
              <DialogDescription className="text-center">
                Tu producto será procesado y estará disponible para recoger pronto.
              </DialogDescription>
            </div>
          ) : (
            selectedProduct && (
              <>
                <DialogHeader>
                  <DialogTitle>Confirmar Canje</DialogTitle>
                  <DialogDescription>¿Deseas canjear este producto?</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="relative aspect-square overflow-hidden rounded-lg bg-muted">
                    <Image
                      src={selectedProduct.image_url || "/placeholder.svg"}
                      alt={selectedProduct.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedProduct.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedProduct.description}</p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">Costo:</span>
                    <Badge variant="secondary" className="text-base font-bold">
                      {selectedProduct.points_cost} puntos
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">Tus puntos actuales:</span>
                    <span className="font-bold text-primary">{profile.eco_points}</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted p-3">
                    <span className="text-sm font-medium">Puntos después del canje:</span>
                    <span className="font-bold">{profile.eco_points - selectedProduct.points_cost}</span>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSelectedProduct(null)} disabled={isRedeeming}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleRedeem}
                    disabled={isRedeeming || profile.eco_points < selectedProduct.points_cost}
                  >
                    {isRedeeming ? "Canjeando..." : "Confirmar Canje"}
                  </Button>
                </DialogFooter>
              </>
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProductCard({
  product,
  userPoints,
  onSelect,
}: {
  product: Product
  userPoints: number
  onSelect: (product: Product) => void
}) {
  const canAfford = userPoints >= product.points_cost
  const isOutOfStock = product.stock < 1

  return (
    <Card className={!canAfford || isOutOfStock ? "opacity-60" : ""}>
      <CardHeader className="p-0">
        <div className="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
          <Image src={product.image_url || "/placeholder.svg"} alt={product.name} fill className="object-cover" />
          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <Badge variant="destructive">Agotado</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <CardTitle className="text-base line-clamp-1">{product.name}</CardTitle>
        <CardDescription className="mt-1 line-clamp-2">{product.description}</CardDescription>
        <div className="mt-3 flex items-center justify-between">
          <Badge variant="secondary" className="font-bold">
            {product.points_cost} pts
          </Badge>
          <span className="text-xs text-muted-foreground">Stock: {product.stock}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button
          className="w-full"
          onClick={() => onSelect(product)}
          disabled={!canAfford || isOutOfStock}
          variant={canAfford && !isOutOfStock ? "default" : "outline"}
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          {!canAfford ? "Puntos Insuficientes" : isOutOfStock ? "Agotado" : "Canjear"}
        </Button>
      </CardFooter>
    </Card>
  )
}

function RedemptionsList({ redemptions }: { redemptions: Redemption[] }) {
  if (redemptions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Package className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="mt-4 text-sm text-muted-foreground">Aún no has canjeado ningún producto</p>
        </CardContent>
      </Card>
    )
  }

  const statusConfig = {
    pending: { label: "Pendiente", color: "bg-yellow-500/10 text-yellow-700 border-yellow-200" },
    processing: { label: "Procesando", color: "bg-blue-500/10 text-blue-700 border-blue-200" },
    ready: { label: "Listo", color: "bg-green-500/10 text-green-700 border-green-200" },
    completed: { label: "Completado", color: "bg-gray-500/10 text-gray-700 border-gray-200" },
  }

  return (
    <div className="space-y-4">
      {redemptions.map((redemption) => {
        const status = statusConfig[redemption.status as keyof typeof statusConfig] || statusConfig.pending
        const date = new Date(redemption.created_at)

        return (
          <Card key={redemption.id}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image
                  src={redemption.products.image_url || "/placeholder.svg"}
                  alt={redemption.products.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{redemption.products.name}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <Badge variant="outline" className={status.color}>
                    {status.label}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">-{redemption.points_spent}</p>
                <p className="text-xs text-muted-foreground">puntos</p>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
