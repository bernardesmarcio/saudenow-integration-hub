"use client";

import { useState } from "react";
import { useSystemHealth } from "../../hooks/useSystemHealth";
import { Card, CardHeader, CardTitle, CardContent } from "./card";
import { Button } from "./button";
import { Badge } from "./badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Clock,
  Wifi,
  WifiOff,
  Server,
  Database,
  Activity,
} from "lucide-react";

export function SystemHealthIndicator() {
  const { systemHealth, isChecking, refresh } = useSystemHealth();
  const [isExpanded, setIsExpanded] = useState(false);

  const getOverallIcon = () => {
    switch (systemHealth.overall) {
      case "healthy":
        return <CheckCircle className="w-5 h-5 text-success-500" />;
      case "degraded":
        return <AlertTriangle className="w-5 h-5 text-warning-500" />;
      case "critical":
        return <XCircle className="w-5 h-5 text-error-500" />;
      default:
        return <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />;
    }
  };

  const getOverallColor = () => {
    switch (systemHealth.overall) {
      case "healthy":
        return "text-success-600 bg-success-50 border-success-200";
      case "degraded":
        return "text-warning-600 bg-warning-50 border-warning-200";
      case "critical":
        return "text-error-600 bg-error-50 border-error-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getServiceIcon = (serviceName: string, status: string) => {
    if (status === "checking") {
      return <RefreshCw className="w-4 h-4 animate-spin text-gray-500" />;
    }

    const iconClass =
      status === "online" ? "text-success-500" : "text-error-500";

    switch (serviceName) {
      case "Frontend":
        return status === "online" ? (
          <Wifi className={`w-4 h-4 ${iconClass}`} />
        ) : (
          <WifiOff className={`w-4 h-4 ${iconClass}`} />
        );
      case "Backend API":
        return <Server className={`w-4 h-4 ${iconClass}`} />;
      case "Bull Dashboard":
        return <Activity className={`w-4 h-4 ${iconClass}`} />;
      case "Redis":
        return <Database className={`w-4 h-4 ${iconClass}`} />;
      default:
        return status === "online" ? (
          <CheckCircle className={`w-4 h-4 ${iconClass}`} />
        ) : (
          <XCircle className={`w-4 h-4 ${iconClass}`} />
        );
    }
  };

  const getServiceStatus = (status: string) => {
    switch (status) {
      case "online":
        return {
          text: "Online",
          class: "text-success-600 bg-success-50 border-success-200",
        };
      case "offline":
        return {
          text: "Offline",
          class: "text-error-600 bg-error-50 border-error-200",
        };
      case "checking":
        return {
          text: "Verificando",
          class: "text-gray-600 bg-gray-50 border-gray-200",
        };
      default:
        return {
          text: "Desconhecido",
          class: "text-gray-600 bg-gray-50 border-gray-200",
        };
    }
  };

  const onlineServices = systemHealth.services.filter(
    (s) => s.status === "online",
  ).length;
  const totalServices = systemHealth.services.length;

  return (
    <Card className="bg-white border border-gray-200/60 shadow-soft">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg">
            {getOverallIcon()}
            <span className="ml-2">Status do Sistema</span>
            <Badge
              className={`ml-3 ${getOverallColor()} border font-medium capitalize`}
            >
              {systemHealth.overall === "healthy"
                ? "Saudável"
                : systemHealth.overall === "degraded"
                  ? "Degradado"
                  : "Crítico"}
            </Badge>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">
              {onlineServices}/{totalServices} serviços online
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isChecking}
            >
              <RefreshCw
                className={`w-4 h-4 ${isChecking ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            {systemHealth.services.map((service, index) => {
              const statusInfo = getServiceStatus(service.status);

              return (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50/50 border border-gray-200/60"
                >
                  <div className="flex items-center space-x-3">
                    {getServiceIcon(service.name, service.status)}
                    <div>
                      <p className="font-medium text-gray-900">
                        {service.name}
                      </p>
                      <div className="flex items-center space-x-3 text-xs text-gray-500">
                        {service.responseTime && (
                          <span className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {service.responseTime}ms
                          </span>
                        )}
                        {service.lastCheck && (
                          <span>
                            {new Date(service.lastCheck).toLocaleTimeString(
                              "pt-BR",
                            )}
                          </span>
                        )}
                        {service.error && (
                          <span className="text-error-600">
                            {service.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Badge
                      className={`${statusInfo.class} border font-medium text-xs`}
                    >
                      {statusInfo.text}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(service.url, "_blank")}
                      className="p-1 h-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Ações Rápidas
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open("http://localhost:4000/admin/queues", "_blank")
                }
                className="text-xs"
              >
                <Activity className="w-3 h-3 mr-1" />
                Bull Dashboard
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  window.open(
                    "http://localhost:3001/api/v1/retail-pro/health",
                    "_blank",
                  )
                }
                className="text-xs"
              >
                <Server className="w-3 h-3 mr-1" />
                Health API
              </Button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-500 text-center">
            Última atualização:{" "}
            {new Date(systemHealth.lastUpdate).toLocaleString("pt-BR")}
          </div>
        </CardContent>
      )}
    </Card>
  );
}
