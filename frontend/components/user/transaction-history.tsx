import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Recycle, Leaf, Trash2 } from "lucide-react"

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

interface TransactionHistoryProps {
  transactions: Transaction[]
}

const wasteTypeConfig = {
  recyclable: {
    label: "Reciclable",
    icon: Recycle,
    color: "bg-blue-500/10 text-blue-700 border-blue-200",
  },
  organic: {
    label: "Orgánico",
    icon: Leaf,
    color: "bg-green-500/10 text-green-700 border-green-200",
  },
  non_recyclable: {
    label: "No Reciclable",
    icon: Trash2,
    color: "bg-gray-500/10 text-gray-700 border-gray-200",
  },
}

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
          <CardDescription>Aún no has realizado ningún escaneo</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Recycle className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground text-balance">
              Escanea tu primer código QR para comenzar a ganar puntos
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de Transacciones</CardTitle>
        <CardDescription>Tus últimos 10 escaneos</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {transactions.map((transaction) => {
            const config = wasteTypeConfig[transaction.waste_type as keyof typeof wasteTypeConfig]
            const Icon = config.icon
            const date = new Date(transaction.created_at)

            return (
              <div key={transaction.id} className="flex items-start gap-3 rounded-lg border p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${config.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{transaction.waste_bins.waste_stations.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.waste_bins.waste_stations.location}
                      </p>
                    </div>
                    <Badge variant="secondary" className="font-semibold whitespace-nowrap">
                      +{transaction.points_earned}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${config.color}`}>
                      {config.label}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {date.toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
