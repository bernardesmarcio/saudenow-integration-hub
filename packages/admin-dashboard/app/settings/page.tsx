import { MainLayout } from '../../src/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Input } from '../../src/components/ui/input'
import { Badge } from '../../src/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../src/components/ui/tabs'
import { 
  Settings, 
  Database, 
  Zap, 
  Bell, 
  Shield, 
  Monitor,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
  Key,
  Globe,
  Clock,
  Mail
} from 'lucide-react'

export default function SettingsPage() {
  return (
    <MainLayout 
      title="Configurações" 
      description="Configure parâmetros do sistema e integrações"
    >
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Configurações do Sistema</h2>
        <p className="text-gray-600">Gerencie configurações globais, integrações e preferências</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 h-12 bg-white/60 backdrop-blur-sm border border-gray-200/60 shadow-soft">
          <TabsTrigger value="general" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="database" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Database className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Zap className="w-4 h-4 mr-2" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Bell className="w-4 h-4 mr-2" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Shield className="w-4 h-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-brand-500 data-[state=active]:text-white">
            <Monitor className="w-4 h-4 mr-2" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="w-5 h-5 mr-2" />
                  Configurações Gerais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Aplicação
                  </label>
                  <Input defaultValue="SaudeNow Integration Hub" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <Input defaultValue="America/Sao_Paulo" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma Padrão
                  </label>
                  <Input defaultValue="pt-BR" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Configurações de Tempo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout de Sessão (minutos)
                  </label>
                  <Input type="number" defaultValue="60" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de Sync Automático (minutos)
                  </label>
                  <Input type="number" defaultValue="15" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Retenção de Logs (dias)
                  </label>
                  <Input type="number" defaultValue="30" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Database Settings */}
        <TabsContent value="database" className="space-y-6">
          <Card className="bg-white border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="w-5 h-5 mr-2" />
                  Configurações do Banco de Dados
                </div>
                <div className="flex items-center space-x-2">
                  <div className="status-dot healthy" />
                  <span className="text-sm text-success-600">Conectado</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Host do Supabase
                  </label>
                  <Input defaultValue="https://xxx.supabase.co" disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pool de Conexões
                  </label>
                  <Input type="number" defaultValue="10" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timeout de Query (segundos)
                  </label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Backup Automático
                  </label>
                  <select className="w-full p-2 border border-gray-300 rounded-md">
                    <option>Diário às 02:00</option>
                    <option>Semanal</option>
                    <option>Mensal</option>
                    <option>Desabilitado</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button className="mr-3">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
                <Button variant="outline">
                  Testar Conexão
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Retail Pro */}
            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Retail Pro
                  </div>
                  <Badge className="bg-success-50 text-success-600 border-success-200">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Ativo
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      URL Base da API
                    </label>
                    <Input defaultValue="http://macserver-pdv.maconequi.local" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit (requests/min)
                    </label>
                    <Input type="number" defaultValue="120" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Timeout (segundos)
                    </label>
                    <Input type="number" defaultValue="30" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tentativas de Retry
                    </label>
                    <Input type="number" defaultValue="3" />
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <Button className="mr-3">
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button variant="outline">
                    Testar Conexão
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Redis Cache */}
            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Database className="w-5 h-5 mr-2" />
                    Redis Cache
                  </div>
                  <Badge className="bg-warning-50 text-warning-600 border-warning-200">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Offline
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Host Redis
                    </label>
                    <Input defaultValue="localhost" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Porta
                    </label>
                    <Input type="number" defaultValue="6379" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TTL Produtos (horas)
                    </label>
                    <Input type="number" defaultValue="4" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      TTL Estoque (minutos)
                    </label>
                    <Input type="number" defaultValue="5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="bg-white border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="w-5 h-5 mr-2" />
                Configurações de Notificação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email para Alertas
                  </label>
                  <Input type="email" defaultValue="admin@saudenow.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL (opcional)
                  </label>
                  <Input placeholder="https://hooks.slack.com/..." />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Tipos de Alerta</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Falhas de sincronização</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Sistemas offline</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Rate limit atingido</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Erros críticos</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Autenticação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duração do Token JWT (horas)
                  </label>
                  <Input type="number" defaultValue="24" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Máximo de Tentativas de Login
                  </label>
                  <Input type="number" defaultValue="5" />
                </div>
                <div className="space-y-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Exigir MFA para administradores</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Logout automático por inatividade</span>
                  </label>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Key className="w-5 h-5 mr-2" />
                  API Keys
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chave de Criptografia
                  </label>
                  <div className="flex space-x-2">
                    <Input type="password" defaultValue="•••••••••••••••••••" disabled />
                    <Button variant="outline">
                      <RotateCcw className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rotação Automática (dias)
                  </label>
                  <Input type="number" defaultValue="90" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Monitoring Settings */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card className="bg-white border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Configurações de Monitoramento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Intervalo de Health Check (segundos)
                  </label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Limite de Logs por Página
                  </label>
                  <Input type="number" defaultValue="50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Threshold de Erro (%)
                  </label>
                  <Input type="number" defaultValue="5" step="0.1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tempo Limite Response (ms)
                  </label>
                  <Input type="number" defaultValue="1000" />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Métricas Coletadas</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Tempo de resposta</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Taxa de erro</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span className="text-sm">Throughput</span>
                  </label>
                  <label className="flex items-center space-x-3">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm">Uso de memória</span>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t">
        <Button variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Restaurar Padrões
        </Button>
        <Button>
          <Save className="w-4 h-4 mr-2" />
          Salvar Todas as Configurações
        </Button>
      </div>
    </MainLayout>
  )
}