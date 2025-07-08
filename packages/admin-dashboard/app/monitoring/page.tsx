import { MainLayout } from '../../src/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  FileText,
  BarChart3,
  Server,
  Database,
  Zap,
  Eye,
  Download,
  Filter
} from 'lucide-react'

const mockLogs = [
  {
    id: 1,
    timestamp: '2025-01-08T10:45:23Z',
    level: 'INFO',
    service: 'RetailProService',
    message: 'Sync completed successfully - 150 products updated',
    duration: '2.3s'
  },
  {
    id: 2,
    timestamp: '2025-01-08T10:44:01Z',
    level: 'WARN',
    service: 'API Gateway',
    message: 'Rate limit approaching - 85% of quota used',
    duration: '0.1s'
  },
  {
    id: 3,
    timestamp: '2025-01-08T10:43:15Z',
    level: 'ERROR',
    service: 'DatabaseService',
    message: 'Connection timeout - retrying in 5 seconds',
    duration: '30.0s'
  },
  {
    id: 4,
    timestamp: '2025-01-08T10:40:12Z',
    level: 'INFO',
    service: 'Worker',
    message: 'Background job started - product synchronization',
    duration: '0.5s'
  },
  {
    id: 5,
    timestamp: '2025-01-08T10:35:45Z',
    level: 'INFO',
    service: 'HealthCheck',
    message: 'All systems operational',
    duration: '0.2s'
  }
]

const metrics = [
  { name: 'Requests/min', value: '1,234', change: '+5.2%', trend: 'up' },
  { name: 'Error Rate', value: '0.12%', change: '-0.03%', trend: 'down' },
  { name: 'Avg Response', value: '245ms', change: '+12ms', trend: 'up' },
  { name: 'Uptime', value: '99.9%', change: '+0.1%', trend: 'up' }
]

export default function MonitoringPage() {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'ERROR': return 'bg-error-50 text-error-600 border-error-200'
      case 'WARN': return 'bg-warning-50 text-warning-600 border-warning-200'
      case 'INFO': return 'bg-blue-50 text-blue-600 border-blue-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <AlertTriangle className="w-4 h-4" />
      case 'WARN': return <Clock className="w-4 h-4" />
      case 'INFO': return <CheckCircle className="w-4 h-4" />
      default: return <CheckCircle className="w-4 h-4" />
    }
  }

  return (
    <MainLayout 
      title="Monitoramento" 
      description="Logs, métricas e observabilidade do sistema"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Central de Logs</h2>
          <p className="text-gray-600">Monitore a performance e saúde do sistema em tempo real</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <Card key={index} className="bg-gradient-to-br from-white to-gray-50/30 border-0 shadow-soft">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">{metric.name}</p>
                  <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-xs font-medium ${
                      metric.trend === 'up' 
                        ? metric.name === 'Error Rate' 
                          ? 'text-error-600' 
                          : 'text-success-600'
                        : 'text-success-600'
                    }`}>
                      {metric.change}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">vs ontem</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-brand-50 border border-brand-200/60">
                  <BarChart3 className="w-5 h-5 text-brand-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <div className="p-2 rounded-lg bg-success-500 mr-3">
                <Server className="w-4 h-4 text-white" />
              </div>
              API Gateway
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">Online</p>
                <p className="text-sm text-gray-600">Response: 145ms</p>
              </div>
              <div className="status-dot healthy" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <div className="p-2 rounded-lg bg-success-500 mr-3">
                <Database className="w-4 h-4 text-white" />
              </div>
              Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">Conectado</p>
                <p className="text-sm text-gray-600">Latency: 23ms</p>
              </div>
              <div className="status-dot healthy" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-yellow-50/30 border-0 shadow-soft">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center">
              <div className="p-2 rounded-lg bg-warning-500 mr-3">
                <Zap className="w-4 h-4 text-white" />
              </div>
              Workers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-gray-900">Degradado</p>
                <p className="text-sm text-gray-600">Redis offline</p>
              </div>
              <div className="status-dot warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="bg-white border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="p-2 rounded-lg bg-brand-500 mr-3">
              <FileText className="w-4 h-4 text-white" />
            </div>
            Logs Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockLogs.map((log) => (
              <div 
                key={log.id} 
                className="flex items-start space-x-4 p-4 rounded-lg bg-gray-50/50 border border-gray-200/60 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex-shrink-0">
                  <Badge className={`${getLevelColor(log.level)} border font-medium`}>
                    {getLevelIcon(log.level)}
                    <span className="ml-1">{log.level}</span>
                  </Badge>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.message}</p>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.service}
                        </span>
                        <span className="text-xs text-gray-500">
                          {log.duration}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-6 text-center">
            <Button variant="outline">
              Ver Mais Logs
            </Button>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}