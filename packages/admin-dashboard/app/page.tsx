import { MainLayout } from '../src/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../src/components/ui/card'
import { Button } from '../src/components/ui/button'
import { SystemHealthIndicator } from '../src/components/ui/system-health-indicator'
import { 
  Package, 
  Activity, 
  Zap, 
  ArrowRight, 
  BarChart3,
  Shield,
  Gauge,
  Users,
  TrendingUp
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  return (
    <MainLayout 
      title="Dashboard Principal" 
      description="Bem-vindo ao SaudeNow Integration Hub"
    >
      {/* Hero Section */}
      <div className="text-center py-12 mb-8">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Bem-vindo ao <span className="gradient-text">SaudeNow Hub</span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Plataforma completa para gerenciamento de integrações de sistemas de saúde
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="card-hover bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 border border-success-200/60 mb-4">
              <Activity className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">1</h3>
            <p className="text-sm text-gray-600">Integração Ativa</p>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/60 mb-4">
              <Package className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">29.8K</h3>
            <p className="text-sm text-gray-600">Produtos Sincronizados</p>
          </CardContent>
        </Card>

        <Card className="card-hover bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 border border-purple-200/60 mb-4">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">99.8%</h3>
            <p className="text-sm text-gray-600">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* System Health Indicator */}
      <SystemHealthIndicator />

      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Retail Pro */}
        <Card className="card-hover bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-brand-500 mr-3">
                  <Package className="w-5 h-5 text-white" />
                </div>
                Retail Pro
              </div>
              <div className="status-dot healthy" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Gerencie estoque e produtos da integração com Retail Pro
            </p>
            <div className="space-y-3">
              <Link href="/retail-pro">
                <Button className="w-full justify-between group transition-all hover:scale-105">
                  Ver Produtos e Estoque
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/retail-pro/dashboard">
                <Button variant="outline" className="w-full justify-between group">
                  Dashboard de Monitoramento
                  <BarChart3 className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* System Health */}
        <Card className="card-hover bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="p-2 rounded-lg bg-success-500 mr-3">
                  <Gauge className="w-5 h-5 text-white" />
                </div>
                Status do Sistema
              </div>
              <div className="status-dot healthy" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              Monitore a saúde de todos os componentes do sistema
            </p>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">API Gateway</span>
                <span className="text-sm font-medium text-success-600">Online</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-success-600">Conectado</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Workers</span>
                <span className="text-sm font-medium text-success-600">Ativos</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Ver Detalhes Completos
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}