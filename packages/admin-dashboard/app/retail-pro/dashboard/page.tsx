'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MainLayout } from '@/components/layout/MainLayout'
import { 
  Monitor, 
  Database, 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Terminal,
  Settings,
  RefreshCw,
  BarChart3,
  Zap,
  Server,
  Bell,
  ExternalLink,
  Play,
  Square,
  FileText,
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Wifi,
  Shield,
  Gauge,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from 'lucide-react'

interface SystemHealth {
  overall_status: 'healthy' | 'degraded' | 'unhealthy'
  components: {
    api: { status: string; response_time: number }
    database: { status: string; response_time: number }
    cache: { status: string; response_time: number }
    workers: { status: string; active_jobs: number }
  }
  last_check: string
}

interface SyncStatus {
  status: 'idle' | 'syncing' | 'completed' | 'error'
  last_sync: string | null
  products_synced: number
  stock_synced: number
  errors: number
  current_job: any
}

interface Metrics {
  total_requests: number
  error_rate: number
  avg_response_time: number
  throughput: number
  cache_hit_rate: number
  uptime: string
}

interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  message: string
  component: string
}

export default function RetailProDashboard() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
  const [metrics, setMetrics] = useState<Metrics | null>(null)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    loadDashboardData()
    
    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 10000) // 10 seconds
      return () => clearInterval(interval)
    }
  }, [autoRefresh])

  const loadDashboardData = async () => {
    try {
      // Carregar dados em paralelo
      const [healthRes, syncRes, logsRes] = await Promise.all([
        fetch('/api/v1/retail-pro/health'),
        fetch('/api/v1/retail-pro/stores/resende/sync'),
        // Mock logs endpoint - em implementação real viria de uma API
        Promise.resolve({ json: () => generateMockLogs() })
      ])

      const [healthData, syncData] = await Promise.all([
        healthRes.json(),
        syncRes.json()
      ])

      if (healthData.success) {
        setSystemHealth({
          overall_status: healthData.data.status,
          components: healthData.data.checks,
          last_check: healthData.data.timestamp
        })
        
        // Simular métricas baseadas nos dados de health
        setMetrics({
          total_requests: healthData.data.metrics?.total_requests || 15847,
          error_rate: healthData.data.metrics?.error_rate || 0.02,
          avg_response_time: healthData.data.metrics?.avg_response_time || 234,
          throughput: 150, // Mock
          cache_hit_rate: 0.85, // Mock
          uptime: healthData.data.metrics?.uptime || '24h 15m'
        })
      }

      if (syncData.success) {
        setSyncStatus(syncData.data)
      }

      const logsData = await logsRes.json()
      setLogs(logsData)
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generateMockLogs = (): LogEntry[] => {
    const levels: Array<'INFO' | 'WARN' | 'ERROR' | 'DEBUG'> = ['INFO', 'WARN', 'ERROR', 'DEBUG']
    const components = ['RetailProService', 'Worker', 'Cache', 'API', 'Scheduler']
    const messages = [
      'Sync operation completed successfully',
      'Processing batch 15/300 - products: 100',
      'Low stock detected for product PROD-123',
      'API response timeout - retrying...',
      'Cache hit rate: 87%',
      'Health check passed',
      'Database connection established',
      'Queue processing: 5 jobs pending'
    ]

    return Array.from({ length: 20 }, (_, i) => ({
      timestamp: new Date(Date.now() - i * 30000).toISOString(),
      level: levels[Math.floor(Math.random() * levels.length)],
      message: messages[Math.floor(Math.random() * messages.length)],
      component: components[Math.floor(Math.random() * components.length)]
    }))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'pass':
      case 'completed':
        return 'text-green-600 bg-green-100'
      case 'degraded':
      case 'syncing':
        return 'text-yellow-600 bg-yellow-100'
      case 'unhealthy':
      case 'fail':
      case 'error':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR':
        return 'text-red-600 bg-red-100'
      case 'WARN':
        return 'text-yellow-600 bg-yellow-100'
      case 'INFO':
        return 'text-blue-600 bg-blue-100'
      case 'DEBUG':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <MainLayout 
        title="Retail Pro Dashboard" 
        description="Central de monitoramento da integração"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-500 rounded-full animate-spin mx-auto" />
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-brand-300 rounded-full animate-spin mx-auto" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
            </div>
            <p className="text-gray-600 font-medium">Carregando dashboard...</p>
            <p className="text-sm text-gray-400">Conectando aos serviços</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout 
      title="Retail Pro Dashboard" 
      description="Central de monitoramento da integração com a loja Resende"
    >
      {/* Header Controls */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="status-dot healthy" />
            <span className="text-sm font-medium text-gray-700">Sistema Online</span>
          </div>
          <div className="text-xs text-gray-500">
            Última atualização: {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={autoRefresh ? 'default' : 'outline'}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="transition-all hover:scale-105"
          >
            {autoRefresh ? <Square className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            Auto Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadDashboardData}
            className="transition-all hover:scale-105 hover:shadow-lg"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* System Health */}
        <Card className="card-hover bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Status do Sistema</p>
                <div className="flex items-center space-x-2">
                  <div className={`status-dot ${systemHealth?.overall_status === 'healthy' ? 'healthy' : 'error'}`} />
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {systemHealth?.overall_status === 'healthy' ? 'Saudável' : 'Erro'}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Todos os componentes online</p>
              </div>
              <div className="p-3 rounded-xl bg-success-50 border border-success-200/60">
                {systemHealth?.overall_status === 'healthy' ? 
                  <Shield className="w-5 h-5 text-success-600" /> : 
                  <AlertTriangle className="w-5 h-5 text-error-500" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sync Status */}
        <Card className="card-hover bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Sincronização</p>
                <div className="flex items-center space-x-2">
                  <Wifi className="w-4 h-4 text-brand-500" />
                  <p className="text-2xl font-bold text-gray-900 capitalize">
                    {syncStatus?.status === 'completed' ? 'Concluída' : syncStatus?.status || 'Parada'}
                  </p>
                </div>
                <p className="text-xs text-gray-500">Status da última execução</p>
              </div>
              <div className="p-3 rounded-xl bg-brand-50 border border-brand-200/60">
                <Activity className="w-5 h-5 text-brand-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Products Synced */}
        <Card className="card-hover bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Produtos</p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {syncStatus?.products_synced?.toLocaleString() || '0'}
                  </p>
                  <ArrowUpRight className="w-4 h-4 text-success-500" />
                </div>
                <p className="text-xs text-gray-500">Sincronizados com sucesso</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-50 border border-purple-200/60">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Count */}
        <Card className="card-hover bg-gradient-to-br from-white to-orange-50/30 border-0 shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-600">Erros</p>
                <div className="flex items-baseline space-x-1">
                  <p className="text-2xl font-bold text-gray-900">
                    {syncStatus?.errors || 0}
                  </p>
                  {(syncStatus?.errors || 0) === 0 ? (
                    <CheckCircle className="w-4 h-4 text-success-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-error-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  {(syncStatus?.errors || 0) === 0 ? 'Nenhum erro detectado' : 'Últimas 24 horas'}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-200/60">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-r from-white to-gray-50/50 border-0 shadow-soft mb-8">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
            <div className="p-2 rounded-lg bg-brand-500 mr-3">
              <Zap className="w-4 h-4 text-white" />
            </div>
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              className="h-24 flex flex-col space-y-3 bg-white border-gray-200/60 hover:bg-gray-50 hover:border-brand-300 hover:shadow-lg transition-all duration-300 hover:scale-105" 
              variant="outline"
              onClick={() => window.open('/retail-pro', '_blank')}
            >
              <div className="p-2 rounded-lg bg-blue-50">
                <Eye className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Ver Produtos</span>
            </Button>
            
            <Button 
              className="h-24 flex flex-col space-y-3 bg-white border-gray-200/60 hover:bg-gray-50 hover:border-brand-300 hover:shadow-lg transition-all duration-300 hover:scale-105" 
              variant="outline"
              onClick={() => window.open('http://localhost:4000/admin/queues', '_blank')}
            >
              <div className="p-2 rounded-lg bg-purple-50">
                <Terminal className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-sm font-medium">Bull Dashboard</span>
            </Button>
            
            <Button 
              className="h-24 flex flex-col space-y-3 bg-white border-gray-200/60 hover:bg-gray-50 hover:border-brand-300 hover:shadow-lg transition-all duration-300 hover:scale-105" 
              variant="outline"
              onClick={() => {
                fetch('/api/v1/retail-pro/stores/resende/sync', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ type: 'stock_sync', priority: 'high' })
                })
              }}
            >
              <div className="p-2 rounded-lg bg-green-50">
                <RefreshCw className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-sm font-medium">Sync Manual</span>
            </Button>
            
            <Button 
              className="h-24 flex flex-col space-y-3 bg-white border-gray-200/60 hover:bg-gray-50 hover:border-brand-300 hover:shadow-lg transition-all duration-300 hover:scale-105" 
              variant="outline"
              onClick={() => window.open('/api/v1/retail-pro/health', '_blank')}
            >
              <div className="p-2 rounded-lg bg-orange-50">
                <Gauge className="w-5 h-5 text-orange-600" />
              </div>
              <span className="text-sm font-medium">Health Check</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 h-12 bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-soft">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger 
            value="health"
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <Shield className="w-4 h-4 mr-2" />
            Saúde Sistema
          </TabsTrigger>
          <TabsTrigger 
            value="metrics"
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Métricas
          </TabsTrigger>
          <TabsTrigger 
            value="logs"
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <FileText className="w-4 h-4 mr-2" />
            Logs
          </TabsTrigger>
          <TabsTrigger 
            value="tools"
            className="data-[state=active]:bg-brand-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300"
          >
            <Settings className="w-4 h-4 mr-2" />
            Ferramentas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sync Status */}
            <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <div className="p-2 rounded-lg bg-brand-500 mr-3">
                    <Activity className="w-4 h-4 text-white" />
                  </div>
                  Status de Sincronização
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-200/60">
                    <span className="font-medium text-gray-700">Status Atual:</span>
                    <Badge className={`${getStatusColor(syncStatus?.status || 'unknown')} px-3 py-1 font-medium`}>
                      {syncStatus?.status === 'completed' ? 'Concluído' : syncStatus?.status || 'Desconhecido'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-200/60">
                    <span className="font-medium text-gray-700">Última Sincronização:</span>
                    <span className="text-sm text-gray-600 font-mono">
                      {syncStatus?.last_sync ? new Date(syncStatus.last_sync).toLocaleString('pt-BR') : 'Nunca executada'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/60 border border-gray-200/60 text-center">
                      <p className="text-2xl font-bold text-gray-900">{syncStatus?.products_synced?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-gray-600">Produtos</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 border border-gray-200/60 text-center">
                      <p className="text-2xl font-bold text-gray-900">{syncStatus?.stock_synced?.toLocaleString() || '0'}</p>
                      <p className="text-sm text-gray-600">Estoque</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Metrics */}
            <Card className="bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-soft">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center text-lg font-semibold text-gray-900">
                  <div className="p-2 rounded-lg bg-purple-500 mr-3">
                    <TrendingUp className="w-4 h-4 text-white" />
                  </div>
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-lg bg-white/60 border border-gray-200/60">
                    <span className="font-medium text-gray-700">Uptime:</span>
                    <span className="font-bold text-success-600 flex items-center">
                      <div className="status-dot healthy mr-2" />
                      {metrics?.uptime || '24h 15m'}
                    </span>
                  </div>
                  
                  <div className="p-3 rounded-lg bg-white/60 border border-gray-200/60">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-gray-700">Cache Hit Rate:</span>
                      <span className="font-bold text-gray-900">{((metrics?.cache_hit_rate || 0.85) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-brand-500 to-brand-600 h-2 rounded-full transition-all duration-1000" 
                        style={{ width: `${(metrics?.cache_hit_rate || 0.85) * 100}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/60 border border-gray-200/60 text-center">
                      <p className="text-xl font-bold text-gray-900">{metrics?.avg_response_time || 234}ms</p>
                      <p className="text-xs text-gray-600">Tempo Médio</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/60 border border-gray-200/60 text-center">
                      <p className={`text-xl font-bold ${(metrics?.error_rate || 0.02) > 0.05 ? 'text-error-500' : 'text-success-500'}`}>
                        {((metrics?.error_rate || 0.02) * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-600">Taxa de Erro</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="health" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {systemHealth && Object.entries(systemHealth.components).map(([component, status]) => (
              <Card key={component}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      {component === 'api' && <Server className="w-5 h-5 mr-2" />}
                      {component === 'database' && <Database className="w-5 h-5 mr-2" />}
                      {component === 'cache' && <Zap className="w-5 h-5 mr-2" />}
                      {component === 'workers' && <Users className="w-5 h-5 mr-2" />}
                      {component.charAt(0).toUpperCase() + component.slice(1)}
                    </div>
                    <Badge className={getStatusColor(status.status)}>
                      {status.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Tempo de Resposta:</span>
                      <span>{status.response_time}ms</span>
                    </div>
                    {status.active_jobs !== undefined && (
                      <div className="flex justify-between">
                        <span>Jobs Ativos:</span>
                        <span>{status.active_jobs}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Tempo de Resposta</span>
                      <span>{metrics?.avg_response_time || 0}ms</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${Math.min((metrics?.avg_response_time || 0) / 1000 * 100, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm">
                      <span>Cache Hit Rate</span>
                      <span>{((metrics?.cache_hit_rate || 0) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(metrics?.cache_hit_rate || 0) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Throughput</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{metrics?.throughput || 0}</div>
                  <div className="text-sm text-muted-foreground">produtos/minuto</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{metrics?.total_requests?.toLocaleString() || 0}</div>
                  <div className="text-sm text-muted-foreground">total de requests</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Logs em Tempo Real
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="flex items-center space-x-2 text-sm font-mono">
                    <span className="text-gray-500 w-20">
                      {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                    <Badge className={`${getLogLevelColor(log.level)} w-16 text-center`}>
                      {log.level}
                    </Badge>
                    <span className="text-blue-600 w-24">{log.component}</span>
                    <span className="flex-1">{log.message}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tools" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Ferramentas de Monitoramento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.open('/retail-pro', '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Interface de Produtos e Estoque
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.open('http://localhost:4000/admin/queues', '_blank')}
                >
                  <Terminal className="w-4 h-4 mr-2" />
                  Bull Dashboard (Filas)
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => window.open('/api/v1/retail-pro/health', '_blank')}
                >
                  <Monitor className="w-4 h-4 mr-2" />
                  Health Check API
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Operações Manuais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  className="w-full justify-start" 
                  onClick={() => {
                    fetch('/api/v1/retail-pro/stores/resende/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'stock_sync', priority: 'high' })
                    }).then(() => alert('Sincronização de estoque iniciada!'))
                  }}
                >
                  <Package className="w-4 h-4 mr-2" />
                  Sincronizar Estoque
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    fetch('/api/v1/retail-pro/stores/resende/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'product_sync', priority: 'medium' })
                    }).then(() => alert('Sincronização de produtos iniciada!'))
                  }}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Sincronizar Produtos
                </Button>
                
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => {
                    fetch('/api/v1/retail-pro/stores/resende/sync', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ type: 'full_sync', priority: 'low', force: true })
                    }).then(() => alert('Sincronização completa iniciada!'))
                  }}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Sincronização Completa
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </MainLayout>
  )
}