import { MainLayout } from "../../src/components/layout/MainLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../src/components/ui/card";
import { Button } from "../../src/components/ui/button";
import { Badge } from "../../src/components/ui/badge";
import {
  Package,
  Zap,
  Settings,
  Plus,
  CheckCircle,
  AlertTriangle,
  Clock,
  ExternalLink,
} from "lucide-react";

const integrations = [
  {
    id: "retail-pro",
    name: "Retail Pro",
    description: "Sistema de gestão de estoque e vendas",
    status: "active",
    type: "ERP",
    lastSync: "2025-01-08T10:30:00Z",
    version: "v2.1",
    endpoints: 3,
  },
  {
    id: "sap",
    name: "SAP",
    description: "Sistema integrado de gestão empresarial",
    status: "pending",
    type: "ERP",
    lastSync: null,
    version: "v1.0",
    endpoints: 0,
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "CRM e automação de vendas",
    status: "inactive",
    type: "CRM",
    lastSync: null,
    version: "v1.0",
    endpoints: 0,
  },
];

export default function IntegrationsPage() {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-success-50 text-success-600 border-success-200";
      case "pending":
        return "bg-warning-50 text-warning-600 border-warning-200";
      case "inactive":
        return "bg-gray-50 text-gray-600 border-gray-200";
      default:
        return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "inactive":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  return (
    <MainLayout
      title="Integrações"
      description="Gerencie conectores e APIs dos sistemas externos"
    >
      {/* Header Actions */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Conectores Disponíveis
          </h2>
          <p className="text-gray-600">
            Configure e monitore as integrações com sistemas externos
          </p>
        </div>
        <Button className="transition-all hover:scale-105">
          <Plus className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-white to-green-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-success-50 border border-success-200/60 mb-4">
              <CheckCircle className="w-6 h-6 text-success-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">1</h3>
            <p className="text-sm text-gray-600">Ativas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-yellow-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-warning-50 border border-warning-200/60 mb-4">
              <Clock className="w-6 h-6 text-warning-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">1</h3>
            <p className="text-sm text-gray-600">Pendentes</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-gray-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gray-50 border border-gray-200/60 mb-4">
              <AlertTriangle className="w-6 h-6 text-gray-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">1</h3>
            <p className="text-sm text-gray-600">Inativas</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-white to-blue-50/30 border-0 shadow-soft">
          <CardContent className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-50 border border-brand-200/60 mb-4">
              <Zap className="w-6 h-6 text-brand-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">3</h3>
            <p className="text-sm text-gray-600">Total</p>
          </CardContent>
        </Card>
      </div>

      {/* Integrations List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card
            key={integration.id}
            className="card-hover bg-white border-0 shadow-soft"
          >
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-brand-50 border border-brand-200/60">
                    <Package className="w-5 h-5 text-brand-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg font-semibold">
                      {integration.name}
                    </CardTitle>
                    <p className="text-sm text-gray-500">{integration.type}</p>
                  </div>
                </div>
                <Badge
                  className={`${getStatusColor(integration.status)} border font-medium`}
                >
                  {getStatusIcon(integration.status)}
                  <span className="ml-1 capitalize">{integration.status}</span>
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{integration.description}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Versão:</span>
                  <span className="font-medium">{integration.version}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Endpoints:</span>
                  <span className="font-medium">{integration.endpoints}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Última Sync:</span>
                  <span className="font-medium">
                    {integration.lastSync
                      ? new Date(integration.lastSync).toLocaleDateString(
                          "pt-BR",
                        )
                      : "Nunca"}
                  </span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  disabled={integration.status === "inactive"}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Configurar
                </Button>
                {integration.status === "active" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (integration.id === "retail-pro") {
                        window.open("/retail-pro/dashboard", "_blank");
                      }
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MainLayout>
  );
}
