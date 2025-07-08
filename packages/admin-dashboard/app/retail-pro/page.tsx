'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  Search, 
  RefreshCw, 
  Package, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Activity,
  TrendingUp,
  TrendingDown
} from 'lucide-react'

interface StockItem {
  product_sid: string
  product_alu: string
  product_description: string
  store_sid: string
  store_name: string
  quantity: number
  minimum_quantity: number
  po_ordered_quantity: number
  po_received_quantity: number
  status: 'in_stock' | 'out_of_stock' | 'low_stock' | 'no_data'
  last_updated: string
}

interface StockSummary {
  total_products: number
  in_stock: number
  out_of_stock: number
  low_stock: number
  no_data: number
}

interface SyncStatus {
  store_sid: string
  status: 'idle' | 'syncing' | 'error' | 'completed'
  last_product_sync: string | null
  last_stock_sync: string | null
  products_synced: number
  stock_synced: number
  errors: number
}

export default function RetailProPage() {
  const [stockData, setStockData] = useState<StockItem[]>([])
  const [summary, setSummary] = useState<StockSummary | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [filter, setFilter] = useState<'all' | 'in_stock' | 'out_of_stock' | 'low_stock'>('all')
  
  const ITEMS_PER_PAGE = 50
  const STORE_ID = 'resende'

  useEffect(() => {
    loadStockData()
    loadSyncStatus()
    
    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      loadSyncStatus()
    }, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [currentPage, filter])

  const loadStockData = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: ITEMS_PER_PAGE.toString(),
        status: filter,
        force_refresh: 'false'
      })

      // Mock API call - replace with actual API endpoint
      const response = await fetch(`/api/v1/retail-pro/stores/${STORE_ID}/stock?${params}`)
      const data = await response.json()

      if (data.success) {
        setStockData(data.data.stock)
        setSummary(data.data.summary)
      }
    } catch (error) {
      console.error('Error loading stock data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSyncStatus = async () => {
    try {
      // Mock API call - replace with actual API endpoint
      const response = await fetch(`/api/v1/retail-pro/stores/${STORE_ID}/sync`)
      const data = await response.json()

      if (data.success) {
        setSyncStatus(data.data)
      }
    } catch (error) {
      console.error('Error loading sync status:', error)
    }
  }

  const handleSync = async (type: 'incremental_sync' | 'stock_sync' | 'full_sync') => {
    try {
      const response = await fetch(`/api/v1/retail-pro/stores/${STORE_ID}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          force: false,
          priority: 'medium'
        }),
      })

      const data = await response.json()

      if (data.success) {
        // Reload sync status after starting sync
        setTimeout(loadSyncStatus, 1000)
      }
    } catch (error) {
      console.error('Error starting sync:', error)
    }
  }

  const filteredData = stockData.filter(item =>
    item.product_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.product_alu.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'in_stock':
        return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Em Estoque</Badge>
      case 'low_stock':
        return <Badge variant="warning" className="bg-yellow-100 text-yellow-800"><AlertTriangle className="w-3 h-3 mr-1" />Baixo</Badge>
      case 'out_of_stock':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Sem Estoque</Badge>
      case 'no_data':
        return <Badge variant="secondary"><Package className="w-3 h-3 mr-1" />Sem Dados</Badge>
      default:
        return <Badge variant="secondary">Desconhecido</Badge>
    }
  }

  const getSyncStatusBadge = (status: string) => {
    switch (status) {
      case 'syncing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800"><RefreshCw className="w-3 h-3 mr-1 animate-spin" />Sincronizando</Badge>
      case 'completed':
        return <Badge variant="success" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Concluído</Badge>
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>
      case 'idle':
      default:
        return <Badge variant="secondary"><Activity className="w-3 h-3 mr-1" />Inativo</Badge>
    }
  }

  return (
    <MainLayout 
      title="Retail Pro" 
      description="Gestão de estoque da loja Resende"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Controle de Estoque</h2>
          <p className="text-gray-600">Monitoramento em tempo real dos produtos</p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => handleSync('stock_sync')}
            disabled={syncStatus?.status === 'syncing'}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Estoque
          </Button>
          <Button 
            onClick={() => handleSync('incremental_sync')}
            disabled={syncStatus?.status === 'syncing'}
          >
            <Package className="w-4 h-4 mr-2" />
            Sincronização Incremental
          </Button>
        </div>
      </div>

      {/* Sync Status Card */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>Status de Sincronização</span>
              {getSyncStatusBadge(syncStatus.status)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Produtos Sincronizados</p>
                <p className="text-2xl font-bold">{syncStatus.products_synced.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estoque Sincronizado</p>
                <p className="text-2xl font-bold">{syncStatus.stock_synced.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Última Sincronização</p>
                <p className="text-sm">{syncStatus.last_stock_sync ? new Date(syncStatus.last_stock_sync).toLocaleString('pt-BR') : 'Nunca'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Erros</p>
                <p className="text-2xl font-bold text-red-600">{syncStatus.errors}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Package className="w-5 h-5 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{summary.total_products.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Em Estoque</p>
                  <p className="text-2xl font-bold">{summary.in_stock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Baixo Estoque</p>
                  <p className="text-2xl font-bold">{summary.low_stock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-5 h-5 text-red-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sem Estoque</p>
                  <p className="text-2xl font-bold">{summary.out_of_stock.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Sem Dados</p>
                  <p className="text-2xl font-bold">{summary.no_data.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar por produto, ALU ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex space-x-2">
              {(['all', 'in_stock', 'low_stock', 'out_of_stock'] as const).map((status) => (
                <Button
                  key={status}
                  variant={filter === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setFilter(status)
                    setCurrentPage(1)
                  }}
                >
                  {status === 'all' ? 'Todos' : 
                   status === 'in_stock' ? 'Em Estoque' :
                   status === 'low_stock' ? 'Baixo' : 'Sem Estoque'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardHeader>
          <CardTitle>Produtos e Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">ALU</th>
                    <th className="text-left p-2">Descrição</th>
                    <th className="text-center p-2">Quantidade</th>
                    <th className="text-center p-2">Mínimo</th>
                    <th className="text-center p-2">Em Pedido</th>
                    <th className="text-center p-2">Recebido</th>
                    <th className="text-center p-2">Status</th>
                    <th className="text-center p-2">Última Atualização</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.map((item) => (
                    <tr key={item.product_sid} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-mono text-sm">{item.product_alu}</td>
                      <td className="p-2">{item.product_description}</td>
                      <td className="p-2 text-center font-bold">{item.quantity}</td>
                      <td className="p-2 text-center text-muted-foreground">{item.minimum_quantity}</td>
                      <td className="p-2 text-center text-muted-foreground">{item.po_ordered_quantity}</td>
                      <td className="p-2 text-center text-muted-foreground">{item.po_received_quantity}</td>
                      <td className="p-2 text-center">{getStatusBadge(item.status)}</td>
                      <td className="p-2 text-center text-sm text-muted-foreground">
                        {new Date(item.last_updated).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          Exibindo {filteredData.length} de {summary?.total_products || 0} produtos
        </p>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={filteredData.length < ITEMS_PER_PAGE}
          >
            Próxima
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}