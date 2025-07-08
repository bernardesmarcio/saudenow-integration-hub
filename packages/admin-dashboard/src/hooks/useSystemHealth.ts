'use client'

import { useState, useEffect, useCallback } from 'react'

export interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'checking'
  url: string
  responseTime?: number
  error?: string
  lastCheck?: string
}

export interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'critical'
  services: ServiceStatus[]
  lastUpdate: string
}

const SERVICES = [
  {
    name: 'Frontend',
    url: 'http://localhost:3000',
    type: 'frontend'
  },
  {
    name: 'Backend API',
    url: 'http://localhost:3001/api/v1/retail-pro/health',
    type: 'api'
  },
  {
    name: 'Bull Dashboard',
    url: 'http://localhost:4000/api/health',
    type: 'workers'
  },
  {
    name: 'Redis',
    url: 'http://localhost:3001/api/v1/retail-pro/health',
    type: 'redis',
    checkPath: 'checks.cache'
  }
]

export function useSystemHealth() {
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    overall: 'checking' as any,
    services: [],
    lastUpdate: new Date().toISOString()
  })
  const [isChecking, setIsChecking] = useState(false)

  const checkService = async (service: typeof SERVICES[0]): Promise<ServiceStatus> => {
    const startTime = Date.now()
    
    try {
      if (service.type === 'frontend') {
        // Frontend is always online if we're running this code
        return {
          name: service.name,
          status: 'online',
          url: service.url,
          responseTime: 1,
          lastCheck: new Date().toISOString()
        }
      }

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5s timeout

      const response = await fetch(service.url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        }
      })

      clearTimeout(timeoutId)
      const responseTime = Date.now() - startTime

      if (service.type === 'api') {
        const data = await response.json()
        
        if (service.checkPath) {
          // Check specific path in response (for Redis via API)
          const pathValue = service.checkPath.split('.').reduce((obj, key) => obj?.[key], data.data)
          const isRedisHealthy = pathValue?.status === 'pass'
          
          return {
            name: service.name,
            status: isRedisHealthy ? 'online' : 'offline',
            url: service.url,
            responseTime,
            lastCheck: new Date().toISOString(),
            error: isRedisHealthy ? undefined : 'Redis connection failed'
          }
        }

        return {
          name: service.name,
          status: data.success && response.ok ? 'online' : 'offline',
          url: service.url,
          responseTime,
          lastCheck: new Date().toISOString()
        }
      }

      // For other services (like Bull Dashboard)
      return {
        name: service.name,
        status: response.ok ? 'online' : 'offline',
        url: service.url,
        responseTime,
        lastCheck: new Date().toISOString()
      }

    } catch (error: any) {
      return {
        name: service.name,
        status: 'offline',
        url: service.url,
        responseTime: Date.now() - startTime,
        error: error.name === 'AbortError' ? 'Timeout' : error.message,
        lastCheck: new Date().toISOString()
      }
    }
  }

  const checkAllServices = useCallback(async () => {
    setIsChecking(true)
    
    try {
      const serviceChecks = await Promise.all(
        SERVICES.map(service => checkService(service))
      )

      // Determine overall health
      const onlineCount = serviceChecks.filter(s => s.status === 'online').length
      const totalCount = serviceChecks.length
      
      let overall: SystemHealth['overall']
      if (onlineCount === totalCount) {
        overall = 'healthy'
      } else if (onlineCount >= totalCount * 0.5) {
        overall = 'degraded'
      } else {
        overall = 'critical'
      }

      setSystemHealth({
        overall,
        services: serviceChecks,
        lastUpdate: new Date().toISOString()
      })

    } catch (error) {
      console.error('Error checking system health:', error)
    } finally {
      setIsChecking(false)
    }
  }, [])

  useEffect(() => {
    // Initial check
    checkAllServices()

    // Set up periodic checks every 30 seconds
    const interval = setInterval(checkAllServices, 30000)

    return () => clearInterval(interval)
  }, [checkAllServices])

  return {
    systemHealth,
    isChecking,
    refresh: checkAllServices
  }
}