import { MainLayout } from '../../src/components/layout/MainLayout'
import { Card, CardHeader, CardTitle, CardContent } from '../../src/components/ui/card'
import { Button } from '../../src/components/ui/button'
import { Badge } from '../../src/components/ui/badge'
import { 
  Users, 
  UserPlus, 
  Shield, 
  Settings, 
  Eye,
  MoreHorizontal,
  Mail,
  Calendar,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react'

const mockUsers = [
  {
    id: 1,
    name: 'Admin Sistema',
    email: 'admin@saudenow.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2025-01-08T10:30:00Z',
    createdAt: '2024-12-01T09:00:00Z'
  },
  {
    id: 2,
    name: 'João Silva',
    email: 'joao@empresa.com',
    role: 'operator',
    status: 'active',
    lastLogin: '2025-01-07T15:45:00Z',
    createdAt: '2024-12-15T14:30:00Z'
  },
  {
    id: 3,
    name: 'Maria Santos',
    email: 'maria@empresa.com',
    role: 'viewer',
    status: 'pending',
    lastLogin: null,
    createdAt: '2025-01-05T11:20:00Z'
  },
  {
    id: 4,
    name: 'Carlos Oliveira',
    email: 'carlos@empresa.com',
    role: 'operator',
    status: 'inactive',
    lastLogin: '2024-12-20T09:15:00Z',
    createdAt: '2024-11-10T16:45:00Z'
  }
]

const roles = {
  admin: { name: 'Administrador', color: 'bg-purple-50 text-purple-600 border-purple-200' },
  operator: { name: 'Operador', color: 'bg-blue-50 text-blue-600 border-blue-200' },
  viewer: { name: 'Visualizador', color: 'bg-gray-50 text-gray-600 border-gray-200' }
}

export default function UsersPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success-50 text-success-600 border-success-200'
      case 'pending': return 'bg-warning-50 text-warning-600 border-warning-200'
      case 'inactive': return 'bg-gray-50 text-gray-600 border-gray-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'inactive': return <XCircle className="w-4 h-4" />
      default: return <XCircle className="w-4 h-4" />
    }
  }

  const activeUsers = mockUsers.filter(u => u.status === 'active').length
  const pendingUsers = mockUsers.filter(u => u.status === 'pending').length
  const totalUsers = mockUsers.length

  return (
    <MainLayout 
      title="Usuários" 
      description="Gerencie usuários e permissões de acesso"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
          <p className="text-gray-600">Controle de acesso e permissões do sistema</p>
        </div>
        <Button className="transition-all hover:scale-105">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/60 mb-4">
              <Users className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{totalUsers}</h3>
            <p className="text-sm text-gray-600">Total de Usuários</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 border border-success-200/60 mb-4">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{activeUsers}</h3>
            <p className="text-sm text-gray-600">Usuários Ativos</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-yellow-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 border border-warning-200/60 mb-4">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{pendingUsers}</h3>
            <p className="text-sm text-gray-600">Aguardando Aprovação</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-50 border border-purple-200/60 mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">3</h3>
            <p className="text-sm text-gray-600">Níveis de Acesso</p>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-white border-0 shadow-soft">
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="p-2 rounded-lg bg-brand-500 mr-3">
              <Users className="w-4 h-4 text-white" />
            </div>
            Lista de Usuários
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50/50 border border-gray-200/60 hover:bg-gray-100/50 transition-colors"
              >
                <div className="flex items-center space-x-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-semibold">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  
                  {/* User Info */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Mail className="w-4 h-4 mr-1" />
                        {user.email}
                      </span>
                      <span className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        {user.lastLogin 
                          ? `Último acesso: ${new Date(user.lastLogin).toLocaleDateString('pt-BR')}`
                          : 'Nunca acessou'
                        }
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  {/* Role Badge */}
                  <Badge className={`${roles[user.role as keyof typeof roles].color} border font-medium`}>
                    {roles[user.role as keyof typeof roles].name}
                  </Badge>
                  
                  {/* Status Badge */}
                  <Badge className={`${getStatusColor(user.status)} border font-medium`}>
                    {getStatusIcon(user.status)}
                    <span className="ml-1 capitalize">
                      {user.status === 'active' ? 'Ativo' : 
                       user.status === 'pending' ? 'Pendente' : 'Inativo'}
                    </span>
                  </Badge>

                  {/* Actions */}
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Role Permissions Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <Card className="bg-gradient-to-br from-white to-purple-50/30 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Shield className="w-5 h-5 mr-2 text-purple-600" />
              Administrador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Acesso total ao sistema</li>
              <li>• Gerenciar usuários e permissões</li>
              <li>• Configurar integrações</li>
              <li>• Visualizar logs e métricas</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="w-5 h-5 mr-2 text-blue-600" />
              Operador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Executar sincronizações</li>
              <li>• Visualizar produtos e estoque</li>
              <li>• Acessar dashboards</li>
              <li>• Visualizar logs básicos</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-0 shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Eye className="w-5 h-5 mr-2 text-gray-600" />
              Visualizador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Apenas leitura</li>
              <li>• Visualizar dashboards</li>
              <li>• Consultar produtos</li>
              <li>• Sem permissões de escrita</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}