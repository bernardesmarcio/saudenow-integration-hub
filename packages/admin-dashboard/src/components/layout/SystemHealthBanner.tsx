'use client'

import { useState, useEffect } from 'react'
import { useSystemHealth } from '../../hooks/useSystemHealth'
import { Button } from '../ui/button'
import { 
  AlertTriangle, 
  XCircle, 
  X, 
  ExternalLink,
  RefreshCw
} from 'lucide-react'

export function SystemHealthBanner() {
  const { systemHealth, isChecking, refresh } = useSystemHealth()
  const [isDismissed, setIsDismissed] = useState(false)

  // Reset dismissed state when health improves
  useEffect(() => {
    if (systemHealth.overall === 'healthy') {
      setIsDismissed(false)
    }
  }, [systemHealth.overall])

  // Don't show banner if healthy or dismissed
  if (systemHealth.overall === 'healthy' || isDismissed) {
    return null
  }

  const offlineServices = systemHealth.services.filter(s => s.status === 'offline')
  
  const getBannerStyle = () => {
    switch (systemHealth.overall) {
      case 'degraded':
        return 'bg-warning-50 border-warning-200 text-warning-800'
      case 'critical':
        return 'bg-error-50 border-error-200 text-error-800'
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getIcon = () => {
    switch (systemHealth.overall) {
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />
      case 'critical':
        return <XCircle className="w-5 h-5 text-error-600" />
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />
    }
  }

  const getTitle = () => {
    switch (systemHealth.overall) {
      case 'degraded':
        return 'Sistema com Problemas'
      case 'critical':
        return 'Sistema Crítico'
      default:
        return 'Verificando Sistema'
    }
  }

  const getDescription = () => {
    if (offlineServices.length === 0) {
      return 'Verificando status dos serviços...'
    }
    
    if (offlineServices.length === 1) {
      return `${offlineServices[0].name} está offline`
    }
    
    return `${offlineServices.length} serviços estão offline: ${offlineServices.map(s => s.name).join(', ')}`
  }

  const getActionText = () => {
    const redisOffline = offlineServices.some(s => s.name === 'Redis')
    const workersOffline = offlineServices.some(s => s.name === 'Bull Dashboard')
    
    if (redisOffline || workersOffline) {
      return 'Execute: npm run redis:start'
    }
    
    return 'Verifique os serviços'
  }

  return (
    <div className={`border-b ${getBannerStyle()} transition-all duration-300 animate-fade-in`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center space-x-3">
            {getIcon()}
            <div>
              <p className="font-semibold text-sm">{getTitle()}</p>
              <p className="text-sm opacity-90">{getDescription()}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Action suggestion */}
            <div className="hidden sm:block text-xs opacity-75">
              {getActionText()}
            </div>
            
            {/* Refresh button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={refresh}
              disabled={isChecking}
              className="h-8 px-2 text-xs opacity-75 hover:opacity-100"
            >
              <RefreshCw className={`w-3 h-3 mr-1 ${isChecking ? 'animate-spin' : ''}`} />
              Verificar
            </Button>
            
            {/* Quick fix button for Redis */}
            {offlineServices.some(s => s.name === 'Redis' || s.name === 'Bull Dashboard') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Open terminal command helper
                  const command = 'npm run redis:start'
                  navigator.clipboard?.writeText(command)
                  alert(`Comando copiado: ${command}`)
                }}
                className="h-8 px-2 text-xs opacity-75 hover:opacity-100"
              >
                <ExternalLink className="w-3 h-3 mr-1" />
                Copiar Fix
              </Button>
            )}
            
            {/* Dismiss button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="h-8 w-8 p-0 opacity-75 hover:opacity-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}